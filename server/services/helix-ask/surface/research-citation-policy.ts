import fs from "node:fs";
import path from "node:path";
import { extractFilePathsFromText } from "../paths";

type ResearchCitationTier = "codex_reference" | "foundational" | "verification";
export type UncertaintyResearchClaimTier = "diagnostic" | "reportable" | "certifying";

export type ResearchCitationRegistryEntry = {
  id: string;
  title: string;
  url: string;
  domain: string;
  tier: ResearchCitationTier;
  claim_types: string[];
  aliases?: string[];
  doi?: string;
  arxiv_id?: string;
};

type ResearchCitationRegistry = {
  version: number;
  entries: ResearchCitationRegistryEntry[];
};

type ResearchRegistryCache = {
  path: string;
  mtimeMs: number;
  registry: ResearchCitationRegistry;
};

const DEFAULT_RESEARCH_REGISTRY_PATH = path.resolve(
  process.cwd(),
  "configs",
  "helix-ask-research-registry.v1.json",
);

const URL_CITATION_RE = /https?:\/\/[^\s,]+/gi;
const DOI_CITATION_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi;
const ARXIV_CITATION_RE =
  /\b(?:arXiv:)?(?:\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(?:v\d+)?\b/gi;
const PATHLIKE_CITATION_RE =
  /\b(?:external|docs|server|client|shared|modules|scripts|tests)\/[^\s,)\]]+/gi;
const EXPERIMENTAL_MATH_RE =
  /\b(?:experimental|speculative|hypothesis|unverified|frontier|diagnostic|not certified)\b/i;
const WARP_MATH_RE =
  /\b(?:warp|alcubierre|natario|casimir|einstein|general relativity|gravity|spacetime|qft|quantum inequality|stress[-\s]?energy|riemann|ricci|christoffel|metric tensor|tensor)\b/i;

const FALLBACK_RESEARCH_REGISTRY: ResearchCitationRegistry = {
  version: 1,
  entries: [
    {
      id: "codex.clone.protocol.v2",
      title: "Codex Clone Protocol V2 Contract",
      url: "external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs",
      domain: "codex_clone",
      tier: "codex_reference",
      claim_types: ["reasoning_procedure", "orchestration_contract", "message_contract"],
      aliases: [
        "external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs",
        "external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs",
        "external/openai-codex/codex-rs/app-server/src/codex_message_processor.rs",
      ],
    },
    {
      id: "warp.alcubierre.1994.gr_qc_0009013",
      title: "The warp drive: hyper-fast travel within general relativity",
      url: "https://arxiv.org/abs/gr-qc/0009013",
      domain: "warp_foundation",
      tier: "foundational",
      claim_types: ["warp_proposal_reference", "warp_metric_foundation"],
      doi: "10.48550/arXiv.gr-qc/0009013",
      arxiv_id: "gr-qc/0009013",
      aliases: ["https://arxiv.org/pdf/gr-qc/0009013.pdf", "arXiv:gr-qc/0009013"],
    },
    {
      id: "warp.pfenning_ford.1997.gr_qc_9702026",
      title: "The unphysical nature of \"Warp Drive\"",
      url: "https://arxiv.org/abs/gr-qc/9702026",
      domain: "warp_constraints",
      tier: "verification",
      claim_types: ["warp_constraint_reference", "energy_condition_constraint"],
      doi: "10.48550/arXiv.gr-qc/9702026",
      arxiv_id: "gr-qc/9702026",
      aliases: ["https://arxiv.org/pdf/gr-qc/9702026.pdf", "arXiv:gr-qc/9702026"],
    },
    {
      id: "warp.santiago.2021.2105_03079",
      title: "Generic warp drives violate the null energy condition",
      url: "https://arxiv.org/abs/2105.03079",
      domain: "warp_constraints",
      tier: "verification",
      claim_types: ["warp_constraint_reference", "energy_condition_constraint"],
      doi: "10.48550/arXiv.2105.03079",
      arxiv_id: "2105.03079",
      aliases: ["https://arxiv.org/pdf/2105.03079.pdf", "arXiv:2105.03079"],
    },
    {
      id: "warp.bobrick_martire.2021.2102_06824",
      title: "Introducing Physical Warp Drives",
      url: "https://arxiv.org/abs/2102.06824",
      domain: "warp_proposals",
      tier: "foundational",
      claim_types: ["warp_proposal_reference", "warp_metric_foundation"],
      doi: "10.48550/arXiv.2102.06824",
      arxiv_id: "2102.06824",
      aliases: ["https://arxiv.org/pdf/2102.06824.pdf", "arXiv:2102.06824"],
    },
    {
      id: "warp.lentz.2020.2006_07125",
      title: "Breaking the Warp Barrier: Hyper-Fast Solitons in Einstein-Maxwell-Plasma Theory",
      url: "https://arxiv.org/abs/2006.07125",
      domain: "warp_proposals",
      tier: "foundational",
      claim_types: ["warp_proposal_reference", "warp_metric_foundation"],
      doi: "10.48550/arXiv.2006.07125",
      arxiv_id: "2006.07125",
      aliases: ["https://arxiv.org/pdf/2006.07125.pdf", "arXiv:2006.07125"],
    },
    {
      id: "rag.2020.2005_11401",
      title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
      url: "https://arxiv.org/abs/2005.11401",
      domain: "llm_retrieval",
      tier: "foundational",
      claim_types: ["retrieval_grounding", "factual_backing", "citation_contract"],
      doi: "10.48550/arXiv.2005.11401",
      arxiv_id: "2005.11401",
      aliases: ["https://arxiv.org/pdf/2005.11401.pdf", "arXiv:2005.11401"],
    },
    {
      id: "truthfulqa.2021.2109_07958",
      title: "TruthfulQA: Measuring How Models Mimic Human Falsehoods",
      url: "https://arxiv.org/abs/2109.07958",
      domain: "llm_truthfulness",
      tier: "foundational",
      claim_types: ["truthfulness_benchmark", "uncertainty_reporting"],
      doi: "10.48550/arXiv.2109.07958",
      arxiv_id: "2109.07958",
      aliases: ["https://arxiv.org/pdf/2109.07958.pdf", "arXiv:2109.07958"],
    },
    {
      id: "semantic_uncertainty.2023.2302_09664",
      title:
        "Semantic Uncertainty: Linguistic Invariances for Uncertainty Estimation in Natural Language Generation",
      url: "https://arxiv.org/abs/2302.09664",
      domain: "llm_uncertainty",
      tier: "verification",
      claim_types: [
        "uncertainty_estimation",
        "uncertainty_calibration",
        "semantic_entropy",
      ],
      doi: "10.48550/arXiv.2302.09664",
      arxiv_id: "2302.09664",
      aliases: ["https://arxiv.org/pdf/2302.09664.pdf", "arXiv:2302.09664"],
    },
    {
      id: "selfcheckgpt.2023.2303_08896",
      title:
        "SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative LLMs",
      url: "https://arxiv.org/abs/2303.08896",
      domain: "llm_hallucination",
      tier: "verification",
      claim_types: [
        "self_consistency_check",
        "uncertainty_calibration",
        "hallucination_detection",
      ],
      doi: "10.48550/arXiv.2303.08896",
      arxiv_id: "2303.08896",
      aliases: ["https://arxiv.org/pdf/2303.08896.pdf", "arXiv:2303.08896"],
    },
    {
      id: "cove.2023.2309_11495",
      title: "Chain-of-Verification Reduces Hallucination in Large Language Models",
      url: "https://arxiv.org/abs/2309.11495",
      domain: "llm_verification",
      tier: "verification",
      claim_types: ["verification_loop", "reasoning_self_check", "uncertainty_calibration"],
      doi: "10.48550/arXiv.2309.11495",
      arxiv_id: "2309.11495",
      aliases: ["https://arxiv.org/pdf/2309.11495.pdf", "arXiv:2309.11495"],
    },
  ],
};

let researchRegistryCache: ResearchRegistryCache | null = null;

const uniqueCitations = (values: string[]): string[] => {
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

const cleanCitationToken = (value: string): string =>
  String(value ?? "")
    .trim()
    .replace(/[)\].,;!?]+$/g, "");

const normalizeArxivId = (value: string): string | null => {
  const cleaned = cleanCitationToken(value)
    .replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//i, "")
    .replace(/\.pdf$/i, "")
    .replace(/^arxiv:/i, "");
  const match = cleaned.match(/(?:^|[^0-9])([a-z-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?/i);
  return match?.[1] ? match[1].toLowerCase() : null;
};

const normalizeDoi = (value: string): string | null => {
  const cleaned = cleanCitationToken(value).replace(/^doi:\s*/i, "");
  const match = cleaned.match(/10\.\d{4,9}\/[-._;()/:a-z0-9]+/i);
  return match?.[0] ? match[0].toLowerCase() : null;
};

const normalizePathLikeCitation = (value: string): string | null => {
  const cleaned = cleanCitationToken(value).replace(/\\/g, "/");
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned.toLowerCase();
  if (/^[a-z]+:\/\//i.test(cleaned)) return cleaned.toLowerCase();
  return cleaned.toLowerCase();
};

const collectCitationForms = (value: string): Set<string> => {
  const forms = new Set<string>();
  const normalizedPath = normalizePathLikeCitation(value);
  if (normalizedPath) forms.add(normalizedPath);
  const doi = normalizeDoi(value);
  if (doi) {
    forms.add(doi);
    forms.add(`doi:${doi}`);
    forms.add(`https://doi.org/${doi}`);
  }
  const arxiv = normalizeArxivId(value);
  if (arxiv) {
    forms.add(arxiv);
    forms.add(`arxiv:${arxiv}`);
    forms.add(`https://arxiv.org/abs/${arxiv}`);
    forms.add(`https://arxiv.org/pdf/${arxiv}.pdf`);
  }
  return forms;
};

const validateRegistry = (value: unknown): ResearchCitationRegistry | null => {
  if (!value || typeof value !== "object") return null;
  const root = value as Record<string, unknown>;
  const entries = Array.isArray(root.entries) ? root.entries : [];
  const normalizedEntries: ResearchCitationRegistryEntry[] = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const id = String(record.id ?? "").trim();
      const title = String(record.title ?? "").trim();
      const url = String(record.url ?? "").trim();
      const domain = String(record.domain ?? "").trim();
      const tier = String(record.tier ?? "").trim() as ResearchCitationTier;
      if (!id || !title || !url || !domain) return null;
      if (tier !== "codex_reference" && tier !== "foundational" && tier !== "verification") {
        return null;
      }
      const claimTypes = Array.isArray(record.claim_types)
        ? record.claim_types
            .map((claim) => String(claim ?? "").trim())
            .filter(Boolean)
        : [];
      return {
        id,
        title,
        url,
        domain,
        tier,
        claim_types: claimTypes,
        aliases: Array.isArray(record.aliases)
          ? record.aliases.map((alias) => String(alias ?? "").trim()).filter(Boolean)
          : undefined,
        doi: typeof record.doi === "string" ? record.doi.trim() : undefined,
        arxiv_id: typeof record.arxiv_id === "string" ? record.arxiv_id.trim() : undefined,
      } as ResearchCitationRegistryEntry;
    })
    .filter((entry): entry is ResearchCitationRegistryEntry => Boolean(entry));
  if (normalizedEntries.length === 0) return null;
  const parsedVersion = Number(root.version);
  return {
    version: Number.isFinite(parsedVersion) ? parsedVersion : 1,
    entries: normalizedEntries,
  };
};

const loadRegistryFromDisk = (configPath: string): ResearchCitationRegistry | null => {
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return validateRegistry(parsed);
  } catch {
    return null;
  }
};

const getResearchRegistry = (): ResearchCitationRegistry => {
  const configPath = DEFAULT_RESEARCH_REGISTRY_PATH;
  try {
    const stat = fs.statSync(configPath);
    const mtimeMs = stat.mtimeMs;
    if (
      researchRegistryCache &&
      researchRegistryCache.path === configPath &&
      researchRegistryCache.mtimeMs === mtimeMs
    ) {
      return researchRegistryCache.registry;
    }
    const loaded = loadRegistryFromDisk(configPath) ?? FALLBACK_RESEARCH_REGISTRY;
    researchRegistryCache = {
      path: configPath,
      mtimeMs,
      registry: loaded,
    };
    return loaded;
  } catch {
    return FALLBACK_RESEARCH_REGISTRY;
  }
};

const extractHttpCitationsFromText = (value: string): string[] => {
  if (!value) return [];
  const urls = value.match(URL_CITATION_RE) ?? [];
  return uniqueCitations(urls.map((entry) => cleanCitationToken(entry)).filter(Boolean));
};

const extractDoiCitationsFromText = (value: string): string[] => {
  if (!value) return [];
  const dois = value.match(DOI_CITATION_RE) ?? [];
  return uniqueCitations(dois.map((entry) => cleanCitationToken(entry)).filter(Boolean));
};

const extractArxivCitationsFromText = (value: string): string[] => {
  if (!value) return [];
  const ids = value.match(ARXIV_CITATION_RE) ?? [];
  return uniqueCitations(ids.map((entry) => cleanCitationToken(entry)).filter(Boolean));
};

const extractPathCitationsFromText = (value: string): string[] => {
  if (!value) return [];
  const pathLike = value.match(PATHLIKE_CITATION_RE) ?? [];
  return uniqueCitations(
    [...extractFilePathsFromText(value), ...pathLike]
      .map((entry) => cleanCitationToken(entry).replace(/\\/g, "/"))
      .filter(Boolean),
  );
};

export const extractResearchCitations = (value: string): string[] =>
  uniqueCitations([
    ...extractPathCitationsFromText(value),
    ...extractHttpCitationsFromText(value),
    ...extractDoiCitationsFromText(value),
    ...extractArxivCitationsFromText(value),
  ]);

const findRegistryEntryForCitation = (
  citation: string,
  entries: ResearchCitationRegistryEntry[],
): ResearchCitationRegistryEntry | null => {
  const forms = collectCitationForms(citation);
  for (const entry of entries) {
    const entryCitations = [entry.url, ...(entry.aliases ?? []), entry.doi ?? "", entry.arxiv_id ?? ""].filter(
      Boolean,
    );
    const entryForms = new Set<string>();
    for (const candidate of entryCitations) {
      for (const form of collectCitationForms(candidate)) {
        entryForms.add(form);
      }
    }
    for (const form of forms) {
      if (entryForms.has(form)) {
        return entry;
      }
    }
  }
  return null;
};

export const isApprovedResearchCitation = (citation: string): boolean => {
  const registry = getResearchRegistry();
  return Boolean(findRegistryEntryForCitation(citation, registry.entries));
};

export type ExperimentalMathRiskEvaluation = {
  isRisk: boolean;
  signals: string[];
};

export const detectExperimentalMathRisk = (args: {
  question: string;
  text: string;
  intentDomain?: string | null;
}): ExperimentalMathRiskEvaluation => {
  const combined = `${String(args.question ?? "")}\n${String(args.text ?? "")}`.trim();
  const intentDomain = String(args.intentDomain ?? "").trim().toLowerCase();
  const signals: string[] = [];
  const hasExperimentalSignal = EXPERIMENTAL_MATH_RE.test(combined);
  const hasWarpMathSignal = WARP_MATH_RE.test(combined);
  if (hasExperimentalSignal && hasWarpMathSignal) {
    signals.push("experimental_math_signal");
  }
  if (hasWarpMathSignal) {
    signals.push("warp_math_signal");
  }
  if (/(?:^|[._-])(math|physics|warp|gr)(?:$|[._-])/.test(intentDomain)) {
    signals.push(`intent_domain:${intentDomain}`);
  }
  return {
    isRisk: signals.length > 0,
    signals,
  };
};

export type UncertaintyResearchContractEvaluation = {
  required: boolean;
  pass: boolean;
  claimTier: UncertaintyResearchClaimTier;
  tierCoveragePass: boolean;
  missingReasons: string[];
  citations: string[];
  approvedCitations: string[];
  approvedEntryIds: string[];
  foundationalCount: number;
  verificationCount: number;
  codexReferenceCount: number;
  uncertaintyEstimationCount: number;
  constraintReferenceCount: number;
  proposalReferenceCount: number;
  requiredUncertaintyEstimation: boolean;
  claimEvidenceBindingPass: boolean;
  claimEvidenceBindingMissing: string[];
  experimentalMathRisk: boolean;
  experimentalMathSignals: string[];
};

const normalizeUncertaintyResearchClaimTier = (
  value: string | UncertaintyResearchClaimTier | null | undefined,
): UncertaintyResearchClaimTier => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (normalized === "certified" || normalized === "certifying") {
    return "certifying";
  }
  if (
    normalized === "reportable" ||
    normalized === "reduced-order" ||
    normalized === "reduced order"
  ) {
    return "reportable";
  }
  return "diagnostic";
};

const hasClaimType = (entry: ResearchCitationRegistryEntry, claimType: string): boolean =>
  entry.claim_types.some((candidate) => candidate === claimType);

export const evaluateUncertaintyResearchContract = (args: {
  question: string;
  text: string;
  intentDomain?: string | null;
  requireResearchOnUncertainty: boolean;
  uncertaintySignal: boolean;
  claimTier?: string | UncertaintyResearchClaimTier | null;
  seedCitations?: string[];
}): UncertaintyResearchContractEvaluation => {
  const registry = getResearchRegistry();
  const citations = uniqueCitations([
    ...(args.seedCitations ?? []).map((entry) => cleanCitationToken(entry)),
    ...extractResearchCitations(args.text),
  ]);
  const matchedEntries = new Map<string, ResearchCitationRegistryEntry>();
  const approvedCitations: string[] = [];
  for (const citation of citations) {
    const entry = findRegistryEntryForCitation(citation, registry.entries);
    if (!entry) continue;
    matchedEntries.set(entry.id, entry);
    approvedCitations.push(citation);
  }
  const matched = Array.from(matchedEntries.values());
  const foundationalCount = matched.filter((entry) => entry.tier === "foundational").length;
  const verificationCount = matched.filter((entry) => entry.tier === "verification").length;
  const codexReferenceCount = matched.filter((entry) => entry.tier === "codex_reference").length;
  const uncertaintyEstimationCount = matched.filter((entry) =>
    hasClaimType(entry, "uncertainty_estimation"),
  ).length;
  const constraintReferenceCount = matched.filter((entry) =>
    hasClaimType(entry, "warp_constraint_reference"),
  ).length;
  const proposalReferenceCount = matched.filter((entry) =>
    hasClaimType(entry, "warp_proposal_reference"),
  ).length;
  const experimentalMathRisk = detectExperimentalMathRisk({
    question: args.question,
    text: args.text,
    intentDomain: args.intentDomain,
  });
  const claimTier = normalizeUncertaintyResearchClaimTier(args.claimTier);
  const requiredUncertaintyEstimation = claimTier !== "diagnostic";
  const required =
    (args.requireResearchOnUncertainty && args.uncertaintySignal) || experimentalMathRisk.isRisk;
  const claimEvidenceBindingMissing: string[] = [];
  if (required && codexReferenceCount <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:codex_clone_reference");
  }
  if (experimentalMathRisk.isRisk && constraintReferenceCount <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:warp_constraint_reference");
  }
  if (experimentalMathRisk.isRisk && proposalReferenceCount <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:warp_proposal_reference");
  }
  const claimEvidenceBindingPass = claimEvidenceBindingMissing.length === 0;
  const missingReasons: string[] = [];
  if (required && approvedCitations.length <= 0) {
    missingReasons.push("uncertainty_research_contract_missing:approved_research_citation");
  }
  if (required && codexReferenceCount <= 0) {
    missingReasons.push("uncertainty_research_contract_missing:codex_clone_reference");
  }
  if (
    required &&
    claimTier === "diagnostic" &&
    foundationalCount <= 0 &&
    verificationCount <= 0
  ) {
    missingReasons.push(
      "uncertainty_research_contract_missing:diagnostic_foundational_or_verification_reference",
    );
  }
  if (required && claimTier !== "diagnostic" && foundationalCount <= 0) {
    missingReasons.push("uncertainty_research_contract_missing:foundational_reference");
  }
  if (required && claimTier !== "diagnostic" && verificationCount <= 0) {
    missingReasons.push("uncertainty_research_contract_missing:verification_reference");
  }
  if (
    required &&
    requiredUncertaintyEstimation &&
    uncertaintyEstimationCount <= 0
  ) {
    missingReasons.push("uncertainty_research_contract_missing:uncertainty_estimation_reference");
  }
  if (experimentalMathRisk.isRisk && approvedCitations.length <= 0) {
    missingReasons.push("experimental_math_without_research_pair");
  }
  if (required && !claimEvidenceBindingPass) {
    missingReasons.push(...claimEvidenceBindingMissing);
  }
  if (experimentalMathRisk.isRisk && !claimEvidenceBindingPass) {
    missingReasons.push("experimental_math_without_research_pair");
  }
  const tierCoveragePass =
    !required ||
    (claimTier === "diagnostic"
      ? foundationalCount > 0 || verificationCount > 0
      : foundationalCount > 0 &&
        verificationCount > 0 &&
        (!requiredUncertaintyEstimation || uncertaintyEstimationCount > 0));
  if (required && !tierCoveragePass) {
    missingReasons.push("uncertainty_research_contract_missing:tier_coverage");
  }
  const normalizedMissingReasons = uniqueCitations(missingReasons);
  return {
    required,
    pass: !required || normalizedMissingReasons.length === 0,
    claimTier,
    tierCoveragePass,
    missingReasons: normalizedMissingReasons,
    citations: citations.slice(0, 24),
    approvedCitations: uniqueCitations(approvedCitations).slice(0, 16),
    approvedEntryIds: matched.map((entry) => entry.id),
    foundationalCount,
    verificationCount,
    codexReferenceCount,
    uncertaintyEstimationCount,
    constraintReferenceCount,
    proposalReferenceCount,
    requiredUncertaintyEstimation,
    claimEvidenceBindingPass,
    claimEvidenceBindingMissing: uniqueCitations(claimEvidenceBindingMissing),
    experimentalMathRisk: experimentalMathRisk.isRisk,
    experimentalMathSignals: experimentalMathRisk.signals,
  };
};

export const selectResearchCitationFallback = (args: {
  existingCitations?: string[];
  claimTier?: string | UncertaintyResearchClaimTier | null;
  limit?: number;
}): string[] => {
  const registry = getResearchRegistry();
  const limit = Math.max(1, args.limit ?? 8);
  const claimTier = normalizeUncertaintyResearchClaimTier(args.claimTier);
  const existingApproved = uniqueCitations(
    (args.existingCitations ?? []).filter((entry) => isApprovedResearchCitation(entry)),
  );
  const selected: string[] = [...existingApproved];
  const appendTier = (tier: ResearchCitationTier, maxCount: number): void => {
    if (maxCount <= 0) return;
    const entries = registry.entries.filter((entry) => entry.tier === tier).slice(0, maxCount);
    for (const entry of entries) {
      if (selected.length >= limit) return;
      selected.push(entry.url);
    }
  };
  const appendClaimType = (claimType: string, maxCount: number): void => {
    if (maxCount <= 0) return;
    const entries = registry.entries
      .filter((entry) => hasClaimType(entry, claimType))
      .slice(0, maxCount);
    for (const entry of entries) {
      if (selected.length >= limit) return;
      selected.push(entry.url);
    }
  };
  appendTier("codex_reference", 2);
  appendTier("foundational", 2);
  appendTier("verification", 2);
  appendClaimType("warp_constraint_reference", 1);
  appendClaimType("warp_proposal_reference", 1);
  if (claimTier !== "diagnostic") {
    appendClaimType("uncertainty_estimation", 1);
  }
  return uniqueCitations(selected).slice(0, limit);
};
