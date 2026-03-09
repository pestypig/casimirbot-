import type { Request } from "express";
import {
  buildContextCapsuleFingerprint,
  buildContextCapsuleId,
  createContextCapsuleAutomaton,
  extractContextCapsuleIdsFromText,
  injectContextCapsuleCommit,
  isContextCapsuleReplayActive,
  normalizeContextCapsuleId,
  renderContextCapsuleStampLines,
  serializeContextCapsuleBits,
  stepContextCapsuleAutomaton,
  type ContextCapsuleAutomatonControls,
  type ContextCapsuleCommitEvent,
  type ContextCapsuleConvergence,
  type ContextCapsuleMaturityState,
  type ContextCapsulePhase,
  type ContextCapsuleProofState,
  type ContextCapsuleReplayBundle,
  type ContextCapsuleSourceState,
  type ContextCapsuleSummary,
  type ContextCapsuleV1,
} from "@shared/helix-context-capsule";

type ContextCapsuleTraceEvent = {
  stage?: string;
  detail?: string;
  text?: string;
  ts?: string | number;
  meta?: Record<string, unknown>;
};

type ContextCapsuleStoredRecord = {
  capsule: ContextCapsuleV1;
  tenantId: string | null;
  sessionId: string | null;
  traceId: string | null;
  expiresAt: number;
};

type ContextCapsuleBuildArgs = {
  traceId?: string | null;
  runId?: string | null;
  question: string;
  answer: string;
  events: ContextCapsuleTraceEvent[];
  proof?: {
    verdict?: string | null;
    certificateHash?: string | null;
    certificateIntegrityOk?: boolean | null;
  } | null;
};

type ContextCapsuleMergeArgs = {
  capsuleIds: string[];
  tenantId?: string | null;
  sessionId?: string | null;
};

export type CapsuleConstraintBundle = {
  mustKeepTerms: string[];
  preferredEvidencePaths: string[];
};

export type CapsuleMergeTier = "dialogue" | "evidence";

export type ContextCapsuleMergeSummary = {
  requestedCapsuleIds: string[];
  appliedCapsuleIds: string[];
  inactiveCapsuleIds: string[];
  missingCapsuleIds: string[];
  dialogueAppliedCapsuleIds: string[];
  evidenceAppliedCapsuleIds: string[];
  pinnedFiles: string[];
  resolvedConcepts: Array<{ id: string; label: string; evidence: string[] }>;
  recentTopics: string[];
  openSlots: string[];
  constraintBundle: CapsuleConstraintBundle;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const CONTEXT_CAPSULE_TTL_MS = clamp(
  readNumber(process.env.HELIX_CONTEXT_CAPSULE_TTL_MS, 30 * 24 * 60 * 60 * 1000),
  60 * 60 * 1000,
  365 * 24 * 60 * 60 * 1000,
);

const CONTEXT_CAPSULE_MAX_STORE = clamp(
  readNumber(process.env.HELIX_CONTEXT_CAPSULE_MAX_STORE, 2000),
  64,
  20000,
);

const CONTEXT_CAPSULE_MAX_APPLY = clamp(
  readNumber(process.env.HELIX_CONTEXT_CAPSULE_MAX_APPLY, 12),
  1,
  12,
);

const store = new Map<string, ContextCapsuleStoredRecord>();
const fingerprintIndex = new Map<string, string>();

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readBool = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (value === "1") return true;
  if (value === "0") return false;
  return null;
};

const readNumberSafe = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

const normalizeClaimTier = (value: unknown): ContextCapsuleMaturityState | null => {
  const raw = readString(value).toLowerCase().replace(/[-\s]/g, "_");
  if (raw === "exploratory") return "exploratory";
  if (raw === "reduced_order") return "reduced_order";
  if (raw === "diagnostic") return "diagnostic";
  if (raw === "certified") return "certified";
  return null;
};

const normalizePhase = (value: unknown): ContextCapsulePhase | null => {
  const raw = readString(value).toLowerCase();
  if (
    raw === "observe" ||
    raw === "plan" ||
    raw === "retrieve" ||
    raw === "gate" ||
    raw === "synthesize" ||
    raw === "verify" ||
    raw === "execute" ||
    raw === "debrief"
  ) {
    return raw;
  }
  return null;
};

const tokenizeTerms = (value: string): string[] => {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 4);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= 8) break;
  }
  return out;
};

const CONTEXT_CAPSULE_PROOF_POSTURE_SCORE: Record<ContextCapsuleConvergence["proofPosture"], number> = {
  confirmed: 5,
  reasoned: 4,
  hypothesis: 3,
  unknown: 2,
  fail_closed: 1,
};

const CONTEXT_CAPSULE_MATURITY_SCORE: Record<ContextCapsuleConvergence["maturity"], number> = {
  certified: 4,
  diagnostic: 3,
  reduced_order: 2,
  exploratory: 1,
};

const CONTEXT_CAPSULE_PROOF_VERDICT_SCORE: Record<ContextCapsuleV1["commit"]["proof_verdict"], number> = {
  PASS: 3,
  UNKNOWN: 2,
  FAIL: 1,
};

type RankedContextCapsule = {
  requestedId: string;
  capsule: ContextCapsuleV1;
  proofScore: number;
  maturityScore: number;
  verdictScore: number;
  integrityScore: number;
  exactPathSignal: number;
};

const dedupeStrings = (values: string[], limit: number): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
};

const dedupeDocs = (
  values: Array<{ uri: string; title?: string; hash?: string }>,
  limit: number,
): Array<{ uri: string; title?: string; hash?: string }> => {
  const out: Array<{ uri: string; title?: string; hash?: string }> = [];
  const seen = new Set<string>();
  for (const entry of values) {
    const uri = entry?.uri?.trim();
    if (!uri) continue;
    const key = uri.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      uri,
      title: entry.title?.trim() || undefined,
      hash: entry.hash?.trim() || undefined,
    });
    if (out.length >= limit) break;
  }
  return out;
};

const resolveDialogueBundle = (capsule: ContextCapsuleV1): ContextCapsuleReplayBundle => ({
  pinned_files: dedupeStrings(
    [...capsule.replay_active.pinned_files, ...capsule.replay_inactive.pinned_files],
    16,
  ),
  exact_paths: dedupeStrings(
    [...capsule.replay_active.exact_paths, ...capsule.replay_inactive.exact_paths],
    16,
  ),
  docs: dedupeDocs([...capsule.replay_active.docs, ...capsule.replay_inactive.docs], 16),
  resolved_concepts: [...capsule.replay_active.resolved_concepts, ...capsule.replay_inactive.resolved_concepts]
    .slice(0, 16),
  recent_topics: dedupeStrings(
    [...capsule.replay_active.recent_topics, ...capsule.replay_inactive.recent_topics],
    16,
  ),
  open_slots: dedupeStrings(
    [...capsule.replay_active.open_slots, ...capsule.replay_inactive.open_slots],
    16,
  ),
});

const resolveEvidenceBundle = (capsule: ContextCapsuleV1): ContextCapsuleReplayBundle => ({
  pinned_files: dedupeStrings(
    [...capsule.replay_active.pinned_files, ...capsule.replay_inactive.pinned_files],
    16,
  ),
  exact_paths: dedupeStrings(
    [
      ...capsule.replay_active.exact_paths,
      ...capsule.replay_inactive.exact_paths,
      ...capsule.provenance.exact_paths,
    ],
    16,
  ),
  docs: dedupeDocs([...capsule.replay_active.docs, ...capsule.replay_inactive.docs], 16),
  resolved_concepts: [...capsule.replay_active.resolved_concepts, ...capsule.replay_inactive.resolved_concepts]
    .slice(0, 16),
  recent_topics: dedupeStrings(
    [...capsule.replay_active.recent_topics, ...capsule.replay_inactive.recent_topics],
    16,
  ),
  open_slots: dedupeStrings(
    [...capsule.replay_active.open_slots, ...capsule.replay_inactive.open_slots],
    16,
  ),
});

const resolveEvidenceLaneEligible = (capsule: ContextCapsuleV1): boolean => {
  if (capsule.safety.fail_closed || capsule.commit.proof_verdict === "FAIL") return false;
  const exactPaths = dedupeStrings(
    [
      ...capsule.replay_active.exact_paths,
      ...capsule.replay_inactive.exact_paths,
      ...capsule.provenance.exact_paths,
    ],
    32,
  );
  if (exactPaths.length === 0) return false;
  if (capsule.safety.replay_active) return true;
  if (capsule.convergence.source === "open_world") return false;
  if (
    capsule.convergence.proofPosture === "confirmed" ||
    capsule.convergence.proofPosture === "reasoned"
  ) {
    return true;
  }
  return capsule.commit.proof_verdict === "PASS" && capsule.commit.certificate_integrity_ok !== false;
};

const scoreRankedCapsule = (requestedId: string, capsule: ContextCapsuleV1): RankedContextCapsule => {
  const exactPathSignal = dedupeStrings(
    [
      ...capsule.replay_active.exact_paths,
      ...capsule.replay_inactive.exact_paths,
      ...capsule.provenance.exact_paths,
    ],
    32,
  ).length;
  const integrityScore =
    capsule.commit.certificate_integrity_ok === true
      ? 2
      : capsule.commit.certificate_integrity_ok === false
        ? 0
        : 1;
  return {
    requestedId,
    capsule,
    proofScore: CONTEXT_CAPSULE_PROOF_POSTURE_SCORE[capsule.convergence.proofPosture],
    maturityScore: CONTEXT_CAPSULE_MATURITY_SCORE[capsule.convergence.maturity],
    verdictScore: CONTEXT_CAPSULE_PROOF_VERDICT_SCORE[capsule.commit.proof_verdict],
    integrityScore,
    exactPathSignal,
  };
};

const compareRankedCapsules = (a: RankedContextCapsule, b: RankedContextCapsule): number => {
  const proofDelta = b.proofScore - a.proofScore;
  if (proofDelta !== 0) return proofDelta;
  const maturityDelta = b.maturityScore - a.maturityScore;
  if (maturityDelta !== 0) return maturityDelta;
  const verdictDelta = b.verdictScore - a.verdictScore;
  if (verdictDelta !== 0) return verdictDelta;
  const integrityDelta = b.integrityScore - a.integrityScore;
  if (integrityDelta !== 0) return integrityDelta;
  const exactDelta = b.exactPathSignal - a.exactPathSignal;
  if (exactDelta !== 0) return exactDelta;
  const createdDelta = b.capsule.createdAtTsMs - a.capsule.createdAtTsMs;
  if (createdDelta !== 0) return createdDelta;
  return a.requestedId.localeCompare(b.requestedId);
};

const pruneStore = (): void => {
  const now = Date.now();
  for (const [capsuleId, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      if (entry.capsule.fingerprint) {
        fingerprintIndex.delete(entry.capsule.fingerprint);
      }
      store.delete(capsuleId);
    }
  }
  if (store.size <= CONTEXT_CAPSULE_MAX_STORE) return;
  const entries = Array.from(store.entries()).sort(
    (a, b) => a[1].capsule.createdAtTsMs - b[1].capsule.createdAtTsMs,
  );
  const dropCount = store.size - CONTEXT_CAPSULE_MAX_STORE;
  for (let i = 0; i < dropCount; i += 1) {
    const key = entries[i]?.[0];
    if (key) {
      const entry = store.get(key);
      if (entry?.capsule.fingerprint) {
        fingerprintIndex.delete(entry.capsule.fingerprint);
      }
      store.delete(key);
    }
  }
};

const resolveLatestMeta = (events: ContextCapsuleTraceEvent[]): Record<string, unknown> | null => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const meta = asRecord(events[i]?.meta);
    if (meta) return meta;
  }
  return null;
};

const resolveLatestMetaSection = (
  events: ContextCapsuleTraceEvent[],
  key: "retrieval" | "epistemic" | "verification" | "intent",
): Record<string, unknown> | null => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const meta = asRecord(events[i]?.meta);
    if (!meta) continue;
    const section = asRecord(meta[key]);
    if (section) return section;
  }
  return null;
};

const containsOpenWorldRoute = (value: string): boolean =>
  value.toLowerCase().includes("open_world");

const resolveSourceState = (events: ContextCapsuleTraceEvent[]): ContextCapsuleSourceState => {
  const retrieval = resolveLatestMetaSection(events, "retrieval");
  const latestMeta = resolveLatestMeta(events);
  const route =
    readString(retrieval?.retrievalRoute ?? retrieval?.retrieval_route) ||
    readString(latestMeta?.retrievalRoute ?? latestMeta?.retrieval_route);
  const openWorldFlag =
    readBool(retrieval?.openWorldBypassMode ?? retrieval?.open_world_bypass_mode) ??
    readBool(latestMeta?.openWorldBypassMode ?? latestMeta?.open_world_bypass_mode);
  if (openWorldFlag === true || containsOpenWorldRoute(route)) {
    return "open_world";
  }
  const hasExact =
    readBool(retrieval?.has_exact_provenance ?? retrieval?.hasExactProvenance) ??
    readBool(latestMeta?.has_exact_provenance ?? latestMeta?.hasExactProvenance);
  if (hasExact !== true) return "unknown";
  const zoneHint =
    readString(retrieval?.zone_hint ?? retrieval?.zoneHint).toLowerCase() ||
    readString(latestMeta?.zone_hint ?? latestMeta?.zoneHint).toLowerCase();
  const atlasExact =
    readBool(retrieval?.atlas_exact ?? retrieval?.atlasExact) ??
    readBool(latestMeta?.atlas_exact ?? latestMeta?.atlasExact);
  const atlasHits =
    readNumberSafe(retrieval?.atlasHits) ??
    readNumberSafe(latestMeta?.atlasHits) ??
    readNumberSafe(asRecord(retrieval?.channelHits)?.atlas) ??
    readNumberSafe(asRecord(latestMeta?.channelHits)?.atlas) ??
    0;
  if (atlasExact === true || atlasHits > 0 || zoneHint === "mapped_connected") {
    return "atlas_exact";
  }
  return "repo_exact";
};

const resolveProofState = (
  events: ContextCapsuleTraceEvent[],
  proof: ContextCapsuleBuildArgs["proof"],
): ContextCapsuleProofState => {
  const epistemic = resolveLatestMetaSection(events, "epistemic");
  const verification = resolveLatestMetaSection(events, "verification");
  const latestMeta = resolveLatestMeta(events);
  const failReason =
    readString(epistemic?.fail_reason ?? latestMeta?.fail_reason) ||
    readString(epistemic?.helix_ask_fail_reason ?? latestMeta?.helix_ask_fail_reason);
  const verdict = readString(
    verification?.proof_verdict ??
      latestMeta?.proof_verdict ??
      proof?.verdict,
  ).toUpperCase();
  const integrity =
    readBool(
      verification?.certificate_integrity_ok ??
        latestMeta?.certificate_integrity_ok ??
        proof?.certificateIntegrityOk,
    ) ?? null;
  if (failReason || verdict === "FAIL" || integrity === false) return "fail_closed";
  if (verdict === "PASS" && integrity === true) return "confirmed";
  const claimTier = normalizeClaimTier(epistemic?.claim_tier ?? latestMeta?.claim_tier);
  const certifying = readBool(epistemic?.certifying ?? latestMeta?.certifying) ?? false;
  if (claimTier === "certified" && certifying) return "confirmed";
  if (claimTier === "diagnostic" || claimTier === "reduced_order") return "reasoned";
  if (claimTier === "exploratory") return "hypothesis";
  const arbiterMode = readString(epistemic?.arbiter_mode ?? latestMeta?.arbiter_mode).toLowerCase();
  if (arbiterMode === "clarify") return "unknown";
  return "unknown";
};

const resolveMaturityState = (events: ContextCapsuleTraceEvent[]): ContextCapsuleMaturityState => {
  const epistemic = resolveLatestMetaSection(events, "epistemic");
  const latestMeta = resolveLatestMeta(events);
  return (
    normalizeClaimTier(epistemic?.claim_tier) ??
    normalizeClaimTier(latestMeta?.claim_tier) ??
    "diagnostic"
  );
};

const resolvePhaseState = (events: ContextCapsuleTraceEvent[]): ContextCapsulePhase => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    const meta = asRecord(event?.meta);
    const direct = normalizePhase(meta?.phase ?? meta?.phase_tick);
    if (direct) return direct;
    const stage = `${readString(event?.stage)} ${readString(event?.detail)} ${readString(event?.text)}`.toLowerCase();
    if (!stage) continue;
    if (stage.includes("debrief") || stage.includes("final")) return "debrief";
    if (stage.includes("verify proof")) return "verify";
    if (stage.includes("arbiter")) return "gate";
    if (stage.includes("retrieval")) return "retrieve";
    if (stage.includes("plan")) return "plan";
  }
  return "observe";
};

const resolveCommitEvents = (events: ContextCapsuleTraceEvent[]): ContextCapsuleCommitEvent[] => {
  const commits: ContextCapsuleCommitEvent[] = [];
  for (const event of events) {
    const meta = asRecord(event?.meta);
    const explicit = readString(meta?.convergence_commit).toLowerCase();
    if (explicit === "arbiter_commit" || explicit === "proof_commit") {
      commits.push(explicit as ContextCapsuleCommitEvent);
      continue;
    }
    const stage = readString(event?.stage).toLowerCase();
    if (stage === "arbiter commit") commits.push("arbiter_commit");
    if (stage === "verify proof") commits.push("proof_commit");
  }
  return commits;
};

const buildEmptyReplayBundle = (): ContextCapsuleReplayBundle => ({
  pinned_files: [],
  exact_paths: [],
  docs: [],
  resolved_concepts: [],
  recent_topics: [],
  open_slots: [],
});

const buildConvergenceState = (args: {
  events: ContextCapsuleTraceEvent[];
  proof: ContextCapsuleBuildArgs["proof"];
}): ContextCapsuleConvergence => {
  const commits = resolveCommitEvents(args.events);
  return {
    source: resolveSourceState(args.events),
    proofPosture: resolveProofState(args.events, args.proof),
    maturity: resolveMaturityState(args.events),
    phase: resolvePhaseState(args.events),
    collapseEvent: commits.length > 0 ? commits[commits.length - 1] : null,
  };
};

const buildAutomatonStamp = (args: {
  convergence: ContextCapsuleConvergence;
  seedText: string;
}): ContextCapsuleV1["stamp"] => {
  const seed = buildContextCapsuleId(args.seedText);
  const seedValue = Number.parseInt(seed.slice("HXCAP-".length), 16) >>> 0;
  let automaton = createContextCapsuleAutomaton({
    seed: seedValue,
    width: 80,
    height: 16,
    source: args.convergence.source,
  });
  const controls: ContextCapsuleAutomatonControls = {
    source: args.convergence.source,
    proof: args.convergence.proofPosture,
    maturity: args.convergence.maturity,
  };
  for (let i = 0; i < 16; i += 1) {
    automaton = stepContextCapsuleAutomaton(automaton, controls);
  }
  if (args.convergence.collapseEvent) {
    automaton = injectContextCapsuleCommit(automaton, args.convergence.collapseEvent);
  }
  for (let i = 0; i < 8; i += 1) {
    automaton = stepContextCapsuleAutomaton(automaton, controls);
  }
  return {
    rulePreset: args.convergence.maturity,
    tickHz: 20,
    seed: seedValue,
    gridW: automaton.width,
    gridH: automaton.height,
    finalBits: serializeContextCapsuleBits(automaton),
  };
};

export function buildContextCapsuleFromTrace(args: ContextCapsuleBuildArgs): ContextCapsuleV1 {
  const events = Array.isArray(args.events) ? args.events : [];
  const latestMeta = resolveLatestMeta(events);
  const intent = resolveLatestMetaSection(events, "intent");
  const retrieval = resolveLatestMetaSection(events, "retrieval");
  const epistemic = resolveLatestMetaSection(events, "epistemic");
  const verification = resolveLatestMetaSection(events, "verification");
  const convergence = buildConvergenceState({ events, proof: args.proof });
  const commitEvents = resolveCommitEvents(events);
  const seedText = [
    args.traceId ?? "",
    args.runId ?? "",
    args.proof?.certificateHash ?? "",
    args.question,
    args.answer.slice(0, 240),
    JSON.stringify(convergence),
  ].join("|");
  const stamp = buildAutomatonStamp({ convergence, seedText });
  const capsuleId = normalizeContextCapsuleId(
    buildContextCapsuleId(`${seedText}|${stamp.finalBits.slice(0, 128)}`),
  ) ?? buildContextCapsuleId(seedText);
  const proofVerdict = readString(
    verification?.proof_verdict ?? latestMeta?.proof_verdict ?? args.proof?.verdict,
  ).toUpperCase();
  const normalizedProofVerdict: "PASS" | "FAIL" | "UNKNOWN" =
    proofVerdict === "PASS" || proofVerdict === "FAIL" ? proofVerdict : "UNKNOWN";
  const certificateHash =
    readString(
      verification?.certificate_hash ??
        latestMeta?.certificate_hash ??
        args.proof?.certificateHash,
    ) || null;
  const certificateIntegrity =
    readBool(
      verification?.certificate_integrity_ok ??
        latestMeta?.certificate_integrity_ok ??
        args.proof?.certificateIntegrityOk,
    ) ?? null;
  const exactPaths = readStringArray(retrieval?.exact_paths ?? latestMeta?.exact_paths).slice(0, 16);
  const retrievalRoute =
    readString(retrieval?.retrievalRoute ?? retrieval?.retrieval_route) ||
    readString(latestMeta?.retrievalRoute ?? latestMeta?.retrieval_route) ||
    "unknown";
  const zoneHintRaw =
    readString(retrieval?.zone_hint ?? retrieval?.zoneHint).toLowerCase() ||
    readString(latestMeta?.zone_hint ?? latestMeta?.zoneHint).toLowerCase();
  const zoneHint: "mapped_connected" | "owned_frontier" | "uncharted" =
    zoneHintRaw === "mapped_connected" || zoneHintRaw === "owned_frontier"
      ? (zoneHintRaw as "mapped_connected" | "owned_frontier")
      : "uncharted";
  const hasExact =
    readBool(retrieval?.has_exact_provenance ?? retrieval?.hasExactProvenance) ??
    readBool(latestMeta?.has_exact_provenance ?? latestMeta?.hasExactProvenance) ??
    (exactPaths.length > 0 ? true : false);
  const channelHitsRecord = asRecord(retrieval?.channelHits ?? latestMeta?.channelHits);
  const channelHits: Record<string, number> = {};
  if (channelHitsRecord) {
    for (const [key, value] of Object.entries(channelHitsRecord)) {
      const parsed = readNumberSafe(value);
      if (parsed !== null) channelHits[key] = parsed;
    }
  }
  const atlasHits =
    readNumberSafe(retrieval?.atlasHits) ??
    readNumberSafe(latestMeta?.atlasHits) ??
    readNumberSafe(channelHits.atlas) ??
    0;
  const goal = args.question.trim().slice(0, 640);
  const intentDomain =
    readString(intent?.intent_domain ?? latestMeta?.intent_domain) || "unknown";
  const intentId =
    readString(intent?.intent_id ?? latestMeta?.intent_id) || "unknown";
  const keyTerms = tokenizeTerms(`${args.question} ${args.answer.slice(0, 240)}`);
  const replayBundle: ContextCapsuleReplayBundle = {
    pinned_files: exactPaths.slice(0, 12),
    exact_paths: exactPaths.slice(0, 12),
    docs: [],
    resolved_concepts: readStringArray(intent?.ideology_anchor_node_ids ?? latestMeta?.ideology_anchor_node_ids)
      .slice(0, 8)
      .map((id) => ({ id, label: id.replace(/[_-]/g, " "), evidence: exactPaths.slice(0, 3) })),
    recent_topics: [intentId, intentDomain].filter((entry) => entry && entry !== "unknown"),
    open_slots: [],
  };
  const replayActive = isContextCapsuleReplayActive({
    source: convergence.source,
    proofPosture: convergence.proofPosture,
  });
  const fingerprint = normalizeContextCapsuleId(
    buildContextCapsuleFingerprint({
      bits: stamp.finalBits,
      width: stamp.gridW,
      height: stamp.gridH,
    }),
  ) ?? "HXFP-000000";
  return {
    version: "v1",
    capsuleId,
    fingerprint,
    createdAtTsMs: Date.now(),
    traceId: args.traceId ?? null,
    runId: args.runId ?? null,
    convergence,
    intent: {
      intent_domain: intentDomain,
      intent_id: intentId,
      goal,
      constraints: [],
      key_terms: keyTerms,
    },
    provenance: {
      retrieval_route: retrievalRoute,
      zone_hint: zoneHint,
      has_exact_provenance: hasExact,
      exact_paths: exactPaths,
      primary_path: readString(retrieval?.primary_path ?? latestMeta?.primary_path) || exactPaths[0] || null,
      atlas_hits: atlasHits,
      channel_hits: channelHits,
    },
    epistemic: {
      arbiter_mode: readString(epistemic?.arbiter_mode ?? latestMeta?.arbiter_mode) || "unknown",
      claim_tier:
        readString(epistemic?.claim_tier ?? latestMeta?.claim_tier) || "diagnostic",
      provenance_class:
        readString(epistemic?.provenance_class ?? latestMeta?.provenance_class) || "inferred",
      certifying: readBool(epistemic?.certifying ?? latestMeta?.certifying) ?? false,
      fail_reason:
        readString(epistemic?.fail_reason ?? latestMeta?.fail_reason) || null,
    },
    commit: {
      events: commitEvents,
      proof_verdict: normalizedProofVerdict,
      certificate_hash: certificateHash,
      certificate_integrity_ok: certificateIntegrity,
    },
    replay_active: replayActive ? replayBundle : buildEmptyReplayBundle(),
    replay_inactive: replayActive ? buildEmptyReplayBundle() : replayBundle,
    stamp,
    safety: {
      strict_core: true,
      replay_active: replayActive,
      fail_closed: convergence.proofPosture === "fail_closed",
    },
  };
}

export function summarizeContextCapsule(capsule: ContextCapsuleV1): ContextCapsuleSummary {
  return {
    version: "v1",
    capsuleId: capsule.capsuleId,
    fingerprint: capsule.fingerprint,
    createdAtTsMs: capsule.createdAtTsMs,
    traceId: capsule.traceId,
    runId: capsule.runId,
    convergence: capsule.convergence,
    commit: capsule.commit,
    stamp: capsule.stamp,
    stamp_lines: renderContextCapsuleStampLines({
      bits: capsule.stamp.finalBits,
      width: capsule.stamp.gridW,
      height: capsule.stamp.gridH,
      targetWidth: 10,
      targetHeight: 3,
    }),
    safety: capsule.safety,
  };
}

export function saveContextCapsule(args: {
  capsule: ContextCapsuleV1;
  tenantId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
}): ContextCapsuleV1 {
  pruneStore();
  const capsuleId = normalizeContextCapsuleId(args.capsule.capsuleId) ?? args.capsule.capsuleId;
  const fingerprint =
    normalizeContextCapsuleId(args.capsule.fingerprint) ??
    normalizeContextCapsuleId(
      buildContextCapsuleFingerprint({
        bits: args.capsule.stamp.finalBits,
        width: args.capsule.stamp.gridW,
        height: args.capsule.stamp.gridH,
      }),
    ) ??
    "HXFP-000000";
  const capsule: ContextCapsuleV1 = {
    ...args.capsule,
    capsuleId,
    fingerprint,
  };
  const previous = store.get(capsuleId);
  if (previous?.capsule.fingerprint && previous.capsule.fingerprint !== fingerprint) {
    fingerprintIndex.delete(previous.capsule.fingerprint);
  }
  store.set(capsuleId, {
    capsule,
    tenantId: args.tenantId ?? null,
    sessionId: args.sessionId ?? null,
    traceId: args.traceId ?? null,
    expiresAt: Date.now() + CONTEXT_CAPSULE_TTL_MS,
  });
  fingerprintIndex.set(fingerprint, capsuleId);
  pruneStore();
  return capsule;
}

export function getContextCapsule(args: {
  capsuleId: string;
  tenantId?: string | null;
  sessionId?: string | null;
}): ContextCapsuleV1 | null {
  pruneStore();
  const normalized = normalizeContextCapsuleId(args.capsuleId);
  if (!normalized) return null;
  let entry = store.get(normalized);
  if (!entry && normalized.startsWith("HXFP-")) {
    const mappedId = fingerprintIndex.get(normalized);
    if (mappedId) {
      entry = store.get(mappedId);
    }
  }
  if (!entry) return null;
  if (entry.tenantId && entry.tenantId !== (args.tenantId ?? null)) return null;
  // Cross-chat reuse is tenant-scoped. Session IDs remain stored for observability only.
  return entry.capsule;
}

export function resolveContextCapsuleIds(args: {
  explicit?: string[];
  prompt?: string;
  question?: string;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: string | null) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  };
  for (const id of args.explicit ?? []) {
    push(normalizeContextCapsuleId(id));
  }
  for (const id of extractContextCapsuleIdsFromText(args.prompt)) {
    push(id);
  }
  for (const id of extractContextCapsuleIdsFromText(args.question)) {
    push(id);
  }
  return out.slice(0, CONTEXT_CAPSULE_MAX_APPLY);
}

export function buildSessionMemoryPatchFromCapsules(
  args: ContextCapsuleMergeArgs,
): ContextCapsuleMergeSummary {
  const requestedCapsuleIds = Array.from(
    new Set(args.capsuleIds.map((entry) => normalizeContextCapsuleId(entry)).filter(Boolean) as string[]),
  ).slice(0, CONTEXT_CAPSULE_MAX_APPLY);
  const appliedCapsuleIds: string[] = [];
  const dialogueAppliedCapsuleIds: string[] = [];
  const evidenceAppliedCapsuleIds: string[] = [];
  const inactiveCapsuleIds: string[] = [];
  const missingCapsuleIds: string[] = [];
  const pinnedFiles = new Set<string>();
  const recentTopics = new Set<string>();
  const openSlots = new Set<string>();
  const mustKeepTerms = new Set<string>();
  const preferredEvidencePaths = new Set<string>();
  const resolvedConceptMap = new Map<string, { id: string; label: string; evidence: string[] }>();
  const rankedCapsules: RankedContextCapsule[] = [];
  for (const capsuleId of requestedCapsuleIds) {
    const capsule = getContextCapsule({
      capsuleId,
      tenantId: args.tenantId ?? null,
      sessionId: args.sessionId ?? null,
    });
    if (!capsule) {
      missingCapsuleIds.push(capsuleId);
      continue;
    }
    rankedCapsules.push(scoreRankedCapsule(capsuleId, capsule));
  }

  for (const ranked of rankedCapsules.sort(compareRankedCapsules)) {
    const capsuleId = ranked.requestedId;
    const capsule = ranked.capsule;
    const dialogueBundle = resolveDialogueBundle(capsule);
    appliedCapsuleIds.push(capsuleId);
    dialogueAppliedCapsuleIds.push(capsuleId);

    for (const topic of dialogueBundle.recent_topics) {
      const trimmed = topic.trim();
      if (trimmed) {
        recentTopics.add(trimmed);
        tokenizeTerms(trimmed).forEach((token) => mustKeepTerms.add(token));
      }
    }
    for (const slot of dialogueBundle.open_slots) {
      const trimmed = slot.trim();
      if (trimmed) {
        openSlots.add(trimmed);
        tokenizeTerms(trimmed).forEach((token) => mustKeepTerms.add(token));
      }
    }
    for (const term of capsule.intent.key_terms ?? []) {
      const trimmed = term.trim().toLowerCase();
      if (trimmed) mustKeepTerms.add(trimmed);
    }
    const topicSeed = `${capsule.intent.intent_id} ${capsule.intent.intent_domain}`
      .replace(/[_-]+/g, " ")
      .trim();
    tokenizeTerms(topicSeed).forEach((token) => mustKeepTerms.add(token));

    const evidenceEligible = resolveEvidenceLaneEligible(capsule);
    if (!evidenceEligible) {
      inactiveCapsuleIds.push(capsuleId);
      continue;
    }
    evidenceAppliedCapsuleIds.push(capsuleId);
    const evidenceBundle = resolveEvidenceBundle(capsule);
    for (const path of evidenceBundle.pinned_files) {
      const trimmed = path.trim();
      if (trimmed) {
        pinnedFiles.add(trimmed);
        preferredEvidencePaths.add(trimmed);
      }
    }
    for (const path of evidenceBundle.exact_paths) {
      const trimmed = path.trim();
      if (trimmed) {
        pinnedFiles.add(trimmed);
        preferredEvidencePaths.add(trimmed);
      }
    }
    for (const concept of evidenceBundle.resolved_concepts) {
      const id = concept.id.trim();
      if (!id) continue;
      const existing = resolvedConceptMap.get(id);
      if (!existing) {
        resolvedConceptMap.set(id, {
          id,
          label: concept.label.trim() || id,
          evidence: Array.from(new Set(concept.evidence.map((entry) => entry.trim()).filter(Boolean))).slice(0, 8),
        });
        continue;
      }
      const mergedEvidence = Array.from(
        new Set([...existing.evidence, ...concept.evidence.map((entry) => entry.trim()).filter(Boolean)]),
      ).slice(0, 8);
      resolvedConceptMap.set(id, {
        id,
        label: existing.label,
        evidence: mergedEvidence,
      });
    }
    for (const path of capsule.provenance.exact_paths ?? []) {
      const trimmed = path.trim();
      if (!trimmed) continue;
      preferredEvidencePaths.add(trimmed);
      pinnedFiles.add(trimmed);
    }
  }

  return {
    requestedCapsuleIds,
    appliedCapsuleIds,
    dialogueAppliedCapsuleIds,
    evidenceAppliedCapsuleIds,
    inactiveCapsuleIds,
    missingCapsuleIds,
    pinnedFiles: Array.from(pinnedFiles).slice(0, 12),
    resolvedConcepts: Array.from(resolvedConceptMap.values()).slice(0, 8),
    recentTopics: Array.from(recentTopics).slice(0, 8),
    openSlots: Array.from(openSlots).slice(0, 8),
    constraintBundle: {
      mustKeepTerms: Array.from(mustKeepTerms).slice(0, 12),
      preferredEvidencePaths: Array.from(preferredEvidencePaths).slice(0, 12),
    },
  };
}

export function resolveContextCapsuleTenant(req: Request): string | null {
  const tenant =
    req.get("x-tenant-id") ??
    req.get("x-customer-id") ??
    req.get("x-org-id");
  if (!tenant) return null;
  const trimmed = tenant.trim();
  return trimmed.length > 0 ? trimmed : null;
}
