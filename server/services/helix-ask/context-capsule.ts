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

type ContextCapsuleMergeSummary = {
  requestedCapsuleIds: string[];
  appliedCapsuleIds: string[];
  inactiveCapsuleIds: string[];
  missingCapsuleIds: string[];
  pinnedFiles: string[];
  resolvedConcepts: Array<{ id: string; label: string; evidence: string[] }>;
  recentTopics: string[];
  openSlots: string[];
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
  readNumber(process.env.HELIX_CONTEXT_CAPSULE_MAX_APPLY, 3),
  1,
  6,
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
  const inactiveCapsuleIds: string[] = [];
  const missingCapsuleIds: string[] = [];
  const pinnedFiles = new Set<string>();
  const recentTopics = new Set<string>();
  const openSlots = new Set<string>();
  const resolvedConceptMap = new Map<string, { id: string; label: string; evidence: string[] }>();
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
    if (!capsule.safety.replay_active) {
      inactiveCapsuleIds.push(capsuleId);
      continue;
    }
    appliedCapsuleIds.push(capsuleId);
    for (const path of capsule.replay_active.pinned_files) {
      const trimmed = path.trim();
      if (trimmed) pinnedFiles.add(trimmed);
    }
    for (const path of capsule.replay_active.exact_paths) {
      const trimmed = path.trim();
      if (trimmed) pinnedFiles.add(trimmed);
    }
    for (const topic of capsule.replay_active.recent_topics) {
      const trimmed = topic.trim();
      if (trimmed) recentTopics.add(trimmed);
    }
    for (const slot of capsule.replay_active.open_slots) {
      const trimmed = slot.trim();
      if (trimmed) openSlots.add(trimmed);
    }
    for (const concept of capsule.replay_active.resolved_concepts) {
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
  }
  return {
    requestedCapsuleIds,
    appliedCapsuleIds,
    inactiveCapsuleIds,
    missingCapsuleIds,
    pinnedFiles: Array.from(pinnedFiles).slice(0, 12),
    resolvedConcepts: Array.from(resolvedConceptMap.values()).slice(0, 8),
    recentTopics: Array.from(recentTopics).slice(0, 8),
    openSlots: Array.from(openSlots).slice(0, 8),
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
