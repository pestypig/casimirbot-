import { extractFilePathsFromText } from "../paths";
import {
  extractResearchCitations,
  isApprovedResearchCitation,
  selectResearchCitationFallback,
} from "./research-citation-policy";

const REPO_PATH_RE = /^(?:docs|server|client|shared|modules|scripts|tests|external)\//i;
const CODEx_CLONE_CITATION_RE =
  /external\/openai-codex\/codex-rs\/app-server(?:-protocol)?\/src\/(?:protocol\/v2\.rs|bespoke_event_handling\.rs|codex_message_processor\.rs)/i;
const OPERATOR_STEP_RE =
  /\b(?:next step|next retrieval|run|verify|inspect|check|instrument|trace|compare|rerun|narrow retrieval|provide anchor)\b/i;
const UNCERTAINTY_SIGNAL_RE =
  /\b(?:uncertain|uncertainty|diagnostic stage|claim tier|open gaps?|unknown|fail-closed)\b/i;
const HEADING_ONLY_RE = /^\s*([A-Za-z][A-Za-z0-9 /_-]{1,64})\s*:\s*$/;

type SectionMap = Map<string, string[]>;

export type SemanticRepoTechContractEvaluation = {
  required: boolean;
  pass: boolean;
  missingReasons: string[];
  hasPopulationPoint: boolean;
  hasDiagnosticReadPoint: boolean;
  hasOperatorUseStep: boolean;
  claimEvidenceBindingPass: boolean;
  claimEvidenceBindingMissing: string[];
  claimCount: number;
  citations: string[];
  repoCitationCount: number;
  approvedResearchCitationCount: number;
  codexCloneCitationCount: number;
  webResearchCitationCount: number;
};

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const normalized = String(raw ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const normalizePath = (value: string): string =>
  String(value ?? "")
    .trim()
    .replace(/\\/g, "/");

const parseSections = (text: string): SectionMap => {
  const sections: SectionMap = new Map();
  const lines = String(text ?? "").split(/\r?\n/);
  let current: string | null = null;
  for (const line of lines) {
    const headingMatch = line.match(HEADING_ONLY_RE);
    if (headingMatch) {
      current = headingMatch[1]!.trim().toLowerCase();
      if (!sections.has(current)) {
        sections.set(current, []);
      }
      continue;
    }
    if (!current) continue;
    sections.get(current)?.push(line);
  }
  return sections;
};

const readSection = (sections: SectionMap, candidates: string[]): string[] => {
  for (const candidate of candidates) {
    const lines = sections.get(candidate.toLowerCase());
    if (Array.isArray(lines) && lines.length > 0) {
      return lines;
    }
  }
  return [];
};

const stripBulletPrefix = (line: string): string =>
  String(line ?? "")
    .trim()
    .replace(/^[*-]\s+/, "")
    .trim();

const clip = (value: string, maxChars: number): string => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
};

const ensureSentence = (value: string): string => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const buildSourcePool = (citations: string[]): string[] => {
  const repoCitations = citations.filter((entry) => REPO_PATH_RE.test(normalizePath(entry)));
  const fallbackResearch = selectResearchCitationFallback({
    existingCitations: citations,
    claimTier: "diagnostic",
    limit: 8,
  });
  return unique([...repoCitations, ...fallbackResearch]).slice(0, 10);
};

const collectNormalizedCitations = (args: { text: string; seedCitations?: string[] }): string[] =>
  unique([
    ...(args.seedCitations ?? []).map((entry) => String(entry ?? "").trim()),
    ...extractFilePathsFromText(args.text).map((entry) => normalizePath(entry)),
    ...extractResearchCitations(args.text),
  ]);

export const evaluateSemanticRepoTechContract = (args: {
  question: string;
  text: string;
  required: boolean;
  seedCitations?: string[];
}): SemanticRepoTechContractEvaluation => {
  const text = String(args.text ?? "");
  const sections = parseSections(text);
  const directLines = readSection(sections, ["direct answer"]);
  const whereLines = readSection(sections, ["where in repo"]);
  const uncertaintyLines = readSection(sections, ["confidence/uncertainty", "uncertainty band"]);
  const nextStepLines = readSection(sections, ["next step", "next retrieval"]);
  const directClaims = directLines
    .map(stripBulletPrefix)
    .map((entry) => clip(entry, 280))
    .filter((entry) => entry.length >= 18);
  const hasPopulationPoint = directClaims.some(
    (entry) => !/^(?:unknown|insufficient|not enough|cannot determine)\b/i.test(entry),
  );
  const citations = collectNormalizedCitations({
    text,
    seedCitations: args.seedCitations,
  });
  const repoCitations = citations.filter((entry) => REPO_PATH_RE.test(normalizePath(entry)));
  const approvedResearchCitations = citations.filter((entry) => isApprovedResearchCitation(entry));
  const codexCloneCitations = approvedResearchCitations.filter((entry) =>
    CODEx_CLONE_CITATION_RE.test(normalizePath(entry)),
  );
  const webResearchCitations = approvedResearchCitations.filter((entry) =>
    /^https?:\/\//i.test(String(entry ?? "").trim()),
  );
  const whereContent = unique([
    ...whereLines.map(stripBulletPrefix),
    ...repoCitations,
  ]).join("\n");
  const hasDiagnosticReadPoint =
    whereLines.length > 0 && REPO_PATH_RE.test(whereContent.replace(/\\/g, "/"));
  const operatorSurface = [
    ...directLines.map(stripBulletPrefix),
    ...uncertaintyLines.map(stripBulletPrefix),
    ...nextStepLines.map(stripBulletPrefix),
    text,
  ].join("\n");
  const hasOperatorUseStep = OPERATOR_STEP_RE.test(operatorSurface);
  const uncertaintySignal = UNCERTAINTY_SIGNAL_RE.test(`${args.question}\n${text}`);
  const claimEvidenceBindingMissing: string[] = [];
  if (directClaims.length > 0 && repoCitations.length <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:repo_anchor");
  }
  if (uncertaintySignal && codexCloneCitations.length <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:codex_clone_reference");
  }
  if (uncertaintySignal && webResearchCitations.length <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:web_research_reference");
  }
  const claimEvidenceBindingPass = claimEvidenceBindingMissing.length === 0;
  const missingReasons: string[] = [];
  if (args.required && !hasPopulationPoint) {
    missingReasons.push("semantic_repo_tech_missing:population_points");
  }
  if (args.required && !hasDiagnosticReadPoint) {
    missingReasons.push("semantic_repo_tech_missing:diagnostic_read_points");
  }
  if (args.required && !hasOperatorUseStep) {
    missingReasons.push("semantic_repo_tech_missing:operator_use_step");
  }
  if (args.required && !claimEvidenceBindingPass) {
    missingReasons.push(...claimEvidenceBindingMissing);
  }
  return {
    required: args.required,
    pass: !args.required || missingReasons.length === 0,
    missingReasons: unique(missingReasons),
    hasPopulationPoint,
    hasDiagnosticReadPoint,
    hasOperatorUseStep,
    claimEvidenceBindingPass,
    claimEvidenceBindingMissing: unique(claimEvidenceBindingMissing),
    claimCount: directClaims.length,
    citations: citations.slice(0, 24),
    repoCitationCount: repoCitations.length,
    approvedResearchCitationCount: approvedResearchCitations.length,
    codexCloneCitationCount: codexCloneCitations.length,
    webResearchCitationCount: webResearchCitations.length,
  };
};

export const buildSemanticRepoTechContractRepairAnswer = (args: {
  question: string;
  text: string;
  citations: string[];
}): string => {
  const lines = String(args.text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidateDirectAnswer = lines.find(
    (line) =>
      !/^(?:direct answer|where in repo|confidence\/uncertainty|uncertainty band|sources|next step|next retrieval)\s*:/i.test(
        line,
      ),
  );
  const directAnswer =
    ensureSentence(
      clip(
        stripBulletPrefix(candidateDirectAnswer ?? ""),
        240,
      ),
    ) ||
    `Current answer for "${clip(args.question, 96)}" remains bounded to retrieved implementation anchors in this turn.`;
  const repoAnchors = unique(args.citations.map(normalizePath).filter((entry) => REPO_PATH_RE.test(entry))).slice(
    0,
    4,
  );
  const sources = buildSourcePool(args.citations);
  return [
    "Direct Answer:",
    `- ${directAnswer}`,
    "",
    "Where in repo:",
    ...(repoAnchors.length > 0
      ? repoAnchors.map((entry) => `- ${entry}`)
      : ["- Repo anchors are incomplete; provide file/module scope to tighten retrieval."]),
    "",
    "Confidence/Uncertainty:",
    "- Bounded to retrieved evidence; uncertainty remains until cited anchors are expanded for this exact behavior.",
    "",
    "Next Step:",
    "- Run a repo-scoped retrieval on the cited paths and compare against codex-clone and peer-reviewed references before promoting claim tier.",
    "",
    sources.length > 0 ? `Sources: ${sources.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};

export const buildSemanticRepoTechContractUnknownFallback = (args: {
  question: string;
  citations: string[];
  missingReasons: string[];
}): string => {
  const repoAnchors = unique(args.citations.map(normalizePath).filter((entry) => REPO_PATH_RE.test(entry))).slice(
    0,
    4,
  );
  const reasons = unique(args.missingReasons).slice(0, 6).join(", ");
  const sources = buildSourcePool(args.citations);
  return [
    "Direct Answer:",
    `- UNKNOWN for "${clip(args.question, 96)}" until semantic repo-technical contract checks are satisfied.`,
    "",
    "Where in repo:",
    ...(repoAnchors.length > 0
      ? repoAnchors.map((entry) => `- ${entry}`)
      : ["- Explicit repo anchors are missing for this turn."]),
    "",
    "Confidence/Uncertainty:",
    "- High uncertainty; fail-closed because claim-evidence binding and operator actionability checks are incomplete.",
    "",
    "Next Step:",
    "- Run targeted retrieval with concrete file:line anchors, then cite codex-clone paths plus peer-reviewed papers before final claim promotion.",
    reasons ? `Why: ${clip(reasons, 320)}` : "",
    sources.length > 0 ? `Sources: ${sources.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};
