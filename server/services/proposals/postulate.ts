import crypto from "node:crypto";
import type { EssenceProposal } from "@shared/proposals";
import { awardTokens } from "../jobs/token-budget";
import { getProposalById, recordProposalAction, updateProposalFields, upsertProposal } from "../../db/proposals";
import { essenceHub } from "../essence/events";

export type PostulateDomain = "physics" | "engineering" | "ideology" | "product" | "other";

export type SubmitPostulateProposalInput = {
  proposalText: string;
  userComment?: string | null;
  originatingSessionId?: string | null;
  originatingAnswerId?: string | null;
  submittedByAgentId?: string | null;
  ownerId?: string | null;
  accountType?: "developer" | "user" | null;
};

export type PostulateProposalScore = {
  domain: PostulateDomain;
  reviewScore: number;
  congruenceScore: number;
  constructivenessScore: number;
  noveltyScore: number;
  traceabilityScore: number;
  safetyScore: number;
  accepted: boolean;
  rewarded: boolean;
  deterministicReasons: string[];
  evidenceRefs: string[];
  badgeGraphLocatorRefs: string[];
};

const POSTULATE_ACCEPTANCE_THRESHOLD = 0.6;
const POSTULATE_REWARD_THRESHOLD = 0.9;
const POSTULATE_REWARD_TOKENS = Number(process.env.POSTULATE_REWARD_TOKENS ?? 500);

const PHYSICS_TERMS = [
  "physics",
  "casimir",
  "warp",
  "alcubierre",
  "stress-energy",
  "stress energy",
  "qei",
  "quantum inequality",
  "energy condition",
  "metric",
  "curvature",
  "badge graph",
  "graph locator",
];

const EVIDENCE_TERMS = [
  "evidence",
  "experiment",
  "measurement",
  "observed",
  "citation",
  "paper",
  "dataset",
  "verifier",
  "constraint",
  "residual",
  "margin",
];

const CONSTRUCTIVE_TERMS = [
  "resolve",
  "unresolved",
  "gap",
  "badge",
  "locator",
  "graph",
  "test",
  "criteria",
  "patch",
  "candidate",
  "recommendation",
  "review",
];

const OVERCLAIM_TERMS = [
  "proven",
  "proof",
  "certified",
  "guaranteed",
  "true",
  "final",
  "solved",
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const containsAny = (text: string, terms: readonly string[]): boolean =>
  terms.some((term: string) => text.includes(term));

const countMatches = (text: string, terms: readonly string[]): number =>
  terms.reduce((count: number, term: string) => count + (text.includes(term) ? 1 : 0), 0);

const todayKey = () => new Date().toISOString().slice(0, 10);

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const buildReceiptIntegrityHash = (payload: Record<string, unknown>): string =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const extractBadgeGraphLocatorRefs = (text: string): string[] => {
  const refs = new Set<string>();
  const patterns = [
    /\b(?:badge|graph|node|locator)[:#\s]+([a-z0-9_.:/-]{4,80})/gi,
    /\b(theory-badge-graph[:/][a-z0-9_.:/-]{4,120})/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const ref = String(match[1] ?? "").replace(/[),.;\]]+$/g, "").trim();
      if (ref) refs.add(ref);
    }
  }
  return Array.from(refs).slice(0, 12);
};

export function scorePostulateProposal(input: {
  proposalText: string;
  userComment?: string | null;
}): PostulateProposalScore {
  const text = normalizeWhitespace([input.proposalText, input.userComment ?? ""].filter(Boolean).join(" "));
  const lower = text.toLowerCase();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const domain: PostulateDomain = containsAny(lower, PHYSICS_TERMS)
    ? "physics"
    : containsAny(lower, ["product", "panel", "ui", "account", "reward", "chat"])
      ? "product"
      : containsAny(lower, ["ethos", "ideology", "moral", "wisdom"])
        ? "ideology"
        : containsAny(lower, ["api", "backend", "server", "workflow", "runtime"])
          ? "engineering"
          : "other";

  const badgeGraphLocatorRefs = extractBadgeGraphLocatorRefs(text);
  const evidenceHits = countMatches(lower, EVIDENCE_TERMS);
  const constructiveHits = countMatches(lower, CONSTRUCTIVE_TERMS);
  const overclaimHits = countMatches(lower, OVERCLAIM_TERMS);
  const lengthScore = wordCount >= 40 ? 0.18 : wordCount >= 18 ? 0.1 : 0.02;
  const traceabilityScore = clamp01(0.18 + badgeGraphLocatorRefs.length * 0.18 + evidenceHits * 0.08);
  const congruenceScore = clamp01(0.22 + evidenceHits * 0.11 + (domain === "physics" ? 0.08 : 0.04) - overclaimHits * 0.08);
  const constructivenessScore = clamp01(0.24 + constructiveHits * 0.1 + badgeGraphLocatorRefs.length * 0.08 + lengthScore);
  const noveltyScore = clamp01(0.18 + Math.min(wordCount, 120) / 300 + (lower.includes("unresolved") ? 0.1 : 0));
  const safetyScore = clamp01(0.86 - overclaimHits * 0.12 + (lower.includes("candidate") || lower.includes("review") ? 0.08 : 0));
  const reviewScore = clamp01(
    congruenceScore * 0.3 +
      constructivenessScore * 0.3 +
      noveltyScore * 0.15 +
      traceabilityScore * 0.15 +
      safetyScore * 0.1,
  );
  const accepted = reviewScore >= POSTULATE_ACCEPTANCE_THRESHOLD;
  const rewarded = reviewScore >= POSTULATE_REWARD_THRESHOLD;
  const deterministicReasons = [
    `domain:${domain}`,
    `word_count:${wordCount}`,
    `evidence_terms:${evidenceHits}`,
    `constructive_terms:${constructiveHits}`,
    `locator_refs:${badgeGraphLocatorRefs.length}`,
    `overclaim_terms:${overclaimHits}`,
    accepted ? "accepted_for_structured_review" : "below_constructive_review_threshold",
    rewarded ? "reward_threshold_met" : "reward_threshold_not_met",
  ];
  const evidenceRefs = [
    evidenceHits > 0 ? "postulate:evidence-term-match" : null,
    badgeGraphLocatorRefs.length > 0 ? "postulate:badge-graph-locator-match" : null,
    domain === "physics" ? "postulate:physics-domain-triage" : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    domain,
    reviewScore,
    congruenceScore,
    constructivenessScore,
    noveltyScore,
    traceabilityScore,
    safetyScore,
    accepted,
    rewarded,
    deterministicReasons,
    evidenceRefs,
    badgeGraphLocatorRefs,
  };
}

export async function submitPostulateProposal(input: SubmitPostulateProposalInput): Promise<{
  proposal: EssenceProposal;
  score: PostulateProposalScore;
  receiptId: string;
}> {
  const text = normalizeWhitespace(input.proposalText);
  if (!text) {
    throw new Error("postulate_proposal_text_required");
  }
  const score = scorePostulateProposal(input);
  const nowIso = new Date().toISOString();
  const receiptId = crypto.randomUUID();
  const seed = [
    input.ownerId ?? "anon",
    input.originatingSessionId ?? "session",
    input.originatingAnswerId ?? "answer",
    text,
    nowIso,
  ].join(":");
  const id = crypto.createHash("sha256").update(`postulate:${seed}`).digest("hex").slice(0, 24);
  const status: EssenceProposal["status"] = score.rewarded
    ? "accepted_rewarded"
    : score.accepted && score.domain === "physics"
      ? "queued_for_graph_review"
      : score.accepted
        ? "accepted"
        : "rejected";
  const title = text.length > 82 ? `${text.slice(0, 79)}...` : text;
  const receiptIntegrityPayload = {
    schema: "helix.postulate_receipt.v1",
    receiptId,
    proposalId: id,
    proposalText: text,
    originatingSessionId: input.originatingSessionId ?? null,
    originatingAnswerId: input.originatingAnswerId ?? null,
    submittedByAgentId: input.submittedByAgentId ?? null,
    authorAccountId: input.ownerId ?? null,
    accountType: input.accountType ?? "user",
    domain: score.domain,
    reviewScore: score.reviewScore,
    status,
    rewardTokens: score.rewarded ? POSTULATE_REWARD_TOKENS : 0,
    createdAt: nowIso,
  };
  const receiptIntegrityHash = buildReceiptIntegrityHash(receiptIntegrityPayload);
  const proposal: EssenceProposal = {
    id,
    kind: "postulate",
    status,
    source: "essence:proposal",
    title: title || "Postulate proposal",
    summary: text.slice(0, 500),
    explanation: input.userComment ? normalizeWhitespace(input.userComment) : "Submitted from a Helix final answer via /postulate.",
    target: {
      type: "postulate-board",
      boardId: "helix-postulates",
      domain: score.domain,
      badgeGraphLocatorRefs: score.badgeGraphLocatorRefs,
    },
    patchKind: "ui-config",
    patch: JSON.stringify({
      command: "/postulate",
      prompt: "Send this postulate to be reviewed",
      graphMutation: "queued_for_developer_review_only",
    }),
    rewardTokens: score.rewarded ? POSTULATE_REWARD_TOKENS : 0,
    ownerId: input.ownerId ?? null,
    safetyStatus: score.accepted ? "passed" : "failed",
    safetyScore: score.reviewScore,
    safetyReport: score.deterministicReasons.join("; "),
    createdAt: nowIso,
    updatedAt: nowIso,
    createdForDay: todayKey(),
    metadata: {
      postulate: {
        schema: "helix.postulate_proposal.v1",
        receiptId,
        receiptIssuedAt: nowIso,
        receiptIntegrityHash,
        receiptClaimStatus: "unclaimed",
        prompt: "/postulate",
        promptLabel: "Send this postulate to be reviewed",
        proposalText: text,
        userComment: input.userComment ? normalizeWhitespace(input.userComment) : null,
        originatingSessionId: input.originatingSessionId ?? null,
        originatingAnswerId: input.originatingAnswerId ?? null,
        submittedByAgentId: input.submittedByAgentId ?? null,
        accountType: input.accountType ?? "user",
        authorAccountId: input.ownerId ?? null,
        rewardCreditStatus: score.rewarded
          ? input.ownerId
            ? "issued"
            : "claim_pending"
          : "none",
        reviewScore: score.reviewScore,
        congruenceScore: score.congruenceScore,
        constructivenessScore: score.constructivenessScore,
        noveltyScore: score.noveltyScore,
        traceabilityScore: score.traceabilityScore,
        safetyScore: score.safetyScore,
        evidenceRefs: score.evidenceRefs,
        badgeGraphLocatorRefs: score.badgeGraphLocatorRefs,
        graphIntegration: score.domain === "physics" && score.accepted
          ? "queued_for_developer_patch_review"
          : "not_applicable",
        graphPatchReviewTask: score.domain === "physics" && score.accepted
          ? {
              status: "queued",
              kind: "developer_patch_review",
              queuedAt: nowIso,
              locatorRefs: score.badgeGraphLocatorRefs,
              instruction: "Review badge graph locators and prepare a patch proposal; do not auto-mutate the theory graph.",
            }
          : null,
        claimBoundary: "accepted means constructive review candidate, not proof or certification",
      },
    },
  };
  await upsertProposal(proposal);
  await recordProposalAction({
    proposalId: proposal.id,
    action: "status-update",
    userId: input.ownerId ?? "anon",
    note: `postulate submitted; receipt=${receiptId}; score=${Math.round(score.reviewScore * 100)}%`,
  });
  if (score.rewarded && input.ownerId) {
    awardTokens(input.ownerId, POSTULATE_REWARD_TOKENS, `postulate:reward:${proposal.id}`, undefined, {
      source: "proposal",
      ref: proposal.id,
      evidence: receiptId,
    });
  }
  if (score.accepted) {
    essenceHub.emit("proposal-chat", {
      type: "proposal-chat",
      proposalId: proposal.id,
      role: "builder",
      message: `Postulate accepted for structured review at ${Math.round(score.reviewScore * 100)}%. Receipt ${receiptId}.`,
      ts: nowIso,
    });
  }
  return { proposal, score, receiptId };
}

const readPostulateMetadata = (proposal: EssenceProposal): Record<string, unknown> => {
  const postulate = proposal.metadata?.postulate;
  return postulate && typeof postulate === "object" && !Array.isArray(postulate)
    ? postulate as Record<string, unknown>
    : {};
};

export async function claimPostulateReceipt(input: {
  proposalId: string;
  receiptId: string;
  ownerId: string;
}): Promise<EssenceProposal> {
  const proposal = await getProposalById(input.proposalId);
  if (!proposal || proposal.kind !== "postulate") {
    throw new Error("postulate_receipt_not_found");
  }
  const postulate = readPostulateMetadata(proposal);
  const expectedReceiptId = typeof postulate.receiptId === "string" ? postulate.receiptId : "";
  if (!expectedReceiptId || expectedReceiptId !== input.receiptId) {
    throw new Error("postulate_receipt_mismatch");
  }
  if (proposal.ownerId && proposal.ownerId !== input.ownerId) {
    throw new Error("postulate_receipt_already_claimed");
  }
  const rewardCreditStatus = typeof postulate.rewardCreditStatus === "string"
    ? postulate.rewardCreditStatus
    : "none";
  const rewardClaimPending = rewardCreditStatus === "claim_pending" && proposal.rewardTokens > 0;
  const alreadyIssued = rewardCreditStatus === "issued";
  const ownershipOnlyClaim = rewardCreditStatus === "none" && !proposal.ownerId;
  if (!rewardClaimPending && !alreadyIssued && !ownershipOnlyClaim) {
    throw new Error("postulate_receipt_not_claimable");
  }
  if (rewardClaimPending) {
    awardTokens(input.ownerId, proposal.rewardTokens, `postulate:claim:${proposal.id}`, undefined, {
      source: "proposal",
      ref: proposal.id,
      evidence: input.receiptId,
    });
  }
  await updateProposalFields(proposal.id, {
    ownerId: input.ownerId,
    status: rewardClaimPending || alreadyIssued ? "claimed" : proposal.status,
    metadata: {
      ...(proposal.metadata ?? {}),
      postulate: {
        ...postulate,
        authorAccountId: input.ownerId,
        rewardCreditStatus: rewardClaimPending || alreadyIssued ? "issued" : rewardCreditStatus,
        receiptClaimStatus: "claimed",
        claimedAt: new Date().toISOString(),
      },
    },
  });
  await recordProposalAction({
    proposalId: proposal.id,
    action: "status-update",
    userId: input.ownerId,
    note: `postulate receipt claimed; receipt=${input.receiptId}`,
  });
  const claimed = await getProposalById(proposal.id);
  if (!claimed) throw new Error("postulate_receipt_claim_failed");
  return claimed;
}
