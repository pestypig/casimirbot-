import type { TCollapseTraceEntry, TMemorySearchHit } from "@shared/essence-persona";
import type { ResonanceBundle, ResonanceCollapse } from "@shared/code-lattice";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { WhyBelongs } from "@shared/rationale";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import type { BadgeTelemetrySnapshot } from "@shared/badge-telemetry";
import type { EssenceProfile, EssenceProfileUpdate } from "@shared/inferenceProfile";
import type { PromptSpec } from "@shared/prompt-spec";
import type { ChatSession } from "@shared/agi-chat";
import type { AgiRefineryRequest } from "@shared/agi-refinery";
import type { HelixAskResponseEnvelope } from "@shared/helix-ask-envelope";
import type {
  ContextCapsuleReplayBundle,
  ContextCapsuleSummary,
} from "@shared/helix-context-capsule";
import {
  getDefaultReasoningTheaterConfig,
  parseReasoningTheaterConfigPayload,
  type ReasoningTheaterConfigResponse,
} from "@/lib/helix/reasoning-theater-config";
import { DEFAULT_DESKTOP_ID, pushConsoleTelemetry } from "@/lib/agi/consoleTelemetry";
import { ensureLatestLattice } from "@/lib/agi/resonanceVersion";
import { useResonanceStore } from "@/store/useResonanceStore";
import type { LumaMood } from "@/lib/luma-moods";
import type { CollapseDecision, CollapseStrategyName } from "./orchestrator";
import type { LocalCallSpec } from "@shared/local-call-spec";

const HELIX_CONTEXT_CAPSULE_MAX_IDS = 12;

export type PlanResponse = {
  traceId: string;
  plan: unknown;
  manifest?: unknown;
  plan_dsl?: string;
  plan_steps?: unknown[];
  executor_steps?: unknown[];
  prompt?: string;
  planner_prompt?: string;
  telemetry_bundle?: ConsoleTelemetryBundle | null;
  telemetry_summary?: string | Record<string, unknown> | null;
  lattice_version?: number | string | null;
  resonance_bundle?: ResonanceBundle | null;
  resonance_selection?: ResonanceCollapse | null;
  debate_id?: string | null;
  strategy?: string | null;
  strategy_notes?: string[];
  collapse_trace?: TCollapseTraceEntry | null;
  collapse_strategy?: string | null;
  call_spec?: LocalCallSpec | null;
  task_trace?: unknown;
};

export type ExecuteResponse = {
  ok: boolean;
  steps: unknown[];
  result_summary?: string;
  traceId?: string;
  why_belongs?: WhyBelongs;
  planner_prompt?: string;
  telemetry_bundle?: ConsoleTelemetryBundle | null;
  telemetry_summary?: string | Record<string, unknown> | null;
  lattice_version?: number | string | null;
  resonance_bundle?: ResonanceBundle | null;
  resonance_selection?: ResonanceCollapse | null;
  debate_id?: string | null;
};

export type AtomicViewerLaunchParams = {
  model: "quantum" | "classical";
  Z: number;
  n: number;
  l: number;
  m: number;
  sampleCount?: number;
  stress_energy_proxy?: {
    schema_version: "atomic_stress_energy_proxy/1";
    value_J_m3: number;
    units: {
      value: "J/m^3";
      uncertainty: "relative_1sigma";
    };
    uncertainty: {
      relative_1sigma: number;
      absolute_1sigma_J_m3: number;
      confidence: number;
    };
    equation: {
      id: "atomic_stress_energy_proxy_eq.v1";
      expression: string;
    };
    citations: string[];
    claim_tier: "diagnostic";
    provenance_class: "proxy";
    certifying: false;
  };
};

export type AtomicViewerLaunch = {
  viewer: "atomic-orbital";
  panel_id: "electron-orbital";
  tree_id: string;
  source_path?: string;
  params: AtomicViewerLaunchParams;
};

export type LocalAskProof = {
  verdict?: "PASS" | "FAIL";
  firstFail?: unknown;
  certificate?: { certificateHash?: string | null; integrityOk?: boolean | null } | null;
  artifacts?: Array<{ kind: string; ref: string; label?: string }>;
  evidence?: unknown[];
};

export type HaloBankPlace = {
  lat: number;
  lon: number;
  tz?: string;
  label?: string;
};

export type HaloBankComparisonDeltas = {
  dDuration_s?: number;
  dGravExposure_ns?: number;
  dKinExposure_ns?: number;
  dCombExposure_ns?: number;
  dSunExposure_uGal_s?: number;
  dMoonExposure_uGal_s?: number;
  dNetExposure_uGal_s?: number;
  dSunCausal_s?: number;
  dMoonCausal_s?: number;
  overSun?: number;
  overMoon?: number;
  dUbar1m?: number;
  dUbar1h?: number;
  dTS1m?: number;
  dTS1h?: number;
  dNetBearing?: number;
  dNetMag?: number;
  dLightAlong_ms?: number;
  dP2sun?: number;
  dP2moon?: number;
  dPhaseSyn?: number;
  dNodal?: number;
  dPerigee?: number;
};

export type HaloBankActionOutput = {
  ok?: boolean;
  message?: string;
  model?: {
    name?: string;
    version?: string;
    maturity?: string;
    assumptions?: string[];
  };
  primary?: {
    timestamp?: string;
    timestampMs?: number;
    place?: HaloBankPlace;
    durationMs?: number;
    duration_s?: number;
    tides?: { sun_uGal?: number; moon_uGal?: number; net_uGal?: number };
    voxel?: { grav_ns_per_1s?: number; kin_ns_per_1s?: number; combined_ns_per_1s?: number; sunLightTime_s?: number; moonLightTime_s?: number };
    envelope?: { Ubar_1m?: number; Ubar_1h?: number; TS_envelope_1m?: number; TS_envelope_1h?: number };
    tideNet?: { ah_uGal?: number; bearingDeg?: number; x_uGal?: number; y_uGal?: number };
    geometryP2?: { P2sun?: number; P2moon?: number };
    sunMoon?: { phaseDeg?: number; nodalPhaseDeg?: number; perigeePhaseDeg?: number };
  };
  comparison?: {
    primary?: { timestamp?: string; place?: HaloBankPlace; durationMs?: number };
    secondary?: { timestamp?: string; place?: HaloBankPlace; durationMs?: number };
    deltas?: HaloBankComparisonDeltas;
  };
};

export type LocalAskResponse = {
  text: string;
  ok?: boolean;
  error?: string;
  message?: string;
  needs_confirmation?: boolean;
  interpreter_confirm_prompt?: string | null;
  fail_reason?: string | null;
  fail_class?: string | null;
  context_capsule?: ContextCapsuleSummary;
  mode?: "read" | "observe" | "act" | "verify";
  action?: { tool?: string; output?: unknown | HaloBankActionOutput };
  proof?: LocalAskProof;
  envelope?: HelixAskResponseEnvelope;
  viewer_launch?: AtomicViewerLaunch;
  model?: string;
  essence_id?: string;
  seed?: number;
  duration_ms?: number;
  prompt_ingested?: boolean;
  prompt_ingest_source?: string;
  prompt_ingest_reason?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    max_tokens?: number;
  };
  debug?: {
    two_pass?: boolean;
    micro_pass?: boolean;
    micro_pass_auto?: boolean;
    micro_pass_reason?: string;
    scaffold?: string;
    evidence_cards?: string;
    query_hints?: string[];
    queries?: string[];
    context_files?: string[];
    prompt_ingested?: boolean;
    prompt_ingest_source?: string;
    prompt_ingest_reason?: string;
    prompt_chunk_count?: number;
    prompt_selected?: number;
    prompt_context_files?: string[];
    prompt_context_points?: string[];
    prompt_used_sections?: string[];
    intent_id?: string;
    intent_domain?: string;
    intent_tier?: string;
    intent_secondary_tier?: string;
    intent_strategy?: string;
    intent_reason?: string;
    arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
    arbiter_reason?: string;
    arbiter_strictness?: "low" | "med" | "high";
    arbiter_user_expects_repo?: boolean;
    arbiter_repo_ok?: boolean;
    arbiter_hybrid_ok?: boolean;
    arbiter_ratio?: number;
    arbiter_topic_ok?: boolean;
    arbiter_concept_match?: boolean;
    math_solver_ok?: boolean;
    math_solver_kind?: string;
    math_solver_final?: string;
    math_solver_reason?: string;
    math_solver_variable?: string;
    math_solver_gate_pass?: boolean;
    math_solver_gate_reason?: string;
    math_solver_domain_pass?: boolean;
    math_solver_residual_pass?: boolean;
    math_solver_residual_max?: number;
    math_solver_registry_id?: string;
    math_solver_selected_solution?: string;
    math_solver_admissible_count?: number;
    math_solver_maturity?: string;
    evidence_gate_ok?: boolean;
    evidence_match_ratio?: number;
    evidence_match_count?: number;
    evidence_token_count?: number;
    evidence_claim_count?: number;
    evidence_claim_supported?: number;
    evidence_claim_unsupported?: number;
    evidence_claim_ratio?: number;
    evidence_claim_gate_ok?: boolean;
    evidence_claim_missing?: string[];
    evidence_critic_applied?: boolean;
    evidence_critic_ok?: boolean;
    evidence_critic_ratio?: number;
    evidence_critic_count?: number;
    evidence_critic_tokens?: number;
    ambiguity_terms?: string[];
    ambiguity_gate_applied?: boolean;
    overflow_retry_applied?: boolean;
    overflow_retry_steps?: string[];
    overflow_retry_labels?: string[];
    overflow_retry_attempts?: number;
    citation_repair?: boolean;
    format?: "steps" | "compare" | "brief";
    stage_tags?: boolean;
    verbosity?: "brief" | "normal" | "extended";
    junk_clean_applied?: boolean;
    junk_clean_reasons?: string[];
    concept_lint_applied?: boolean;
    concept_lint_reasons?: string[];
    coverage_token_count?: number;
    coverage_key_count?: number;
    coverage_missing_key_count?: number;
    coverage_ratio?: number;
    coverage_missing_keys?: string[];
    coverage_gate_applied?: boolean;
    coverage_gate_reason?: string;
    belief_claim_count?: number;
    belief_supported_count?: number;
    belief_unsupported_count?: number;
    belief_unsupported_rate?: number;
    belief_contradictions?: number;
    belief_gate_applied?: boolean;
    belief_gate_reason?: string;
    belief_graph_node_count?: number;
    belief_graph_edge_count?: number;
    belief_graph_claim_count?: number;
    belief_graph_definition_count?: number;
    belief_graph_conclusion_count?: number;
    belief_graph_evidence_ref_count?: number;
    belief_graph_constraint_count?: number;
    belief_graph_supports?: number;
    belief_graph_contradicts?: number;
    belief_graph_depends_on?: number;
    belief_graph_maps_to?: number;
    belief_graph_claim_ids?: string[];
    belief_graph_unsupported_claim_ids?: string[];
    belief_graph_contradiction_ids?: string[];
    rattling_score?: number;
    rattling_base_distance?: number;
    rattling_perturbation_distance?: number;
    rattling_claim_set_count?: number;
    rattling_gate_applied?: boolean;
    variant_selection_applied?: boolean;
    variant_selection_reason?: string;
    variant_selection_label?: string;
    variant_selection_candidate_count?: number;
    capsule_dialogue_applied_count?: number;
    capsule_evidence_applied_count?: number;
    capsule_retry_applied?: boolean;
    capsule_retry_triggered?: boolean;
    capsule_retry_reason?: string;
    capsule_latest_topic_shift?: boolean;
    capsule_must_keep_terms?: string[];
    capsule_preferred_paths?: string[];
    focus_guard_result?: "pass" | "retry" | "clarify";
    anchor_guard_result?: "pass" | "retry" | "clarify";
    retrieval_channel_hits?: string;
    stage0_used?: boolean;
    stage0_shadow_only?: boolean;
    stage0_candidate_count?: number;
    stage0_hit_rate?: number;
    stage0_fallback_reason?: string | null;
    stage0_build_age_ms?: number | null;
    stage0_commit?: string | null;
    stage0_rollout_mode?: "off" | "shadow" | "partial" | "full" | null;
    stage0_canary_hit?: boolean;
    stage0_soft_must_include_applied?: boolean;
    stage0_policy_decision?: string | null;
    stage0_fail_open_reason?: string | null;
    stage0_code_floor_pass?: boolean;
    stage0_code_path_count?: number;
    stage0_doc_path_count?: number;
    stage05_used?: boolean;
    stage05_file_count?: number;
    stage05_card_count?: number;
    stage05_kind_counts?: {
      code?: number;
      doc?: number;
      config?: number;
      data?: number;
      binary?: number;
    } | null;
    stage05_llm_used?: boolean;
    stage05_fallback_reason?: string | null;
    stage05_extract_ms?: number;
    stage05_total_ms?: number;
    stage05_budget_capped?: boolean;
    stage05_summary_required?: boolean;
    stage05_summary_hard_fail?: boolean;
    stage05_summary_fail_reason?: string | null;
    stage05_slot_plan?: {
      mode?: "dynamic" | "static";
      slots?: string[];
      required?: string[];
    } | null;
    stage05_slot_coverage?: {
      required?: string[];
      present?: string[];
      missing?: string[];
      ratio?: number;
    } | null;
    stage05_fullfile_mode?: boolean;
    stage05_two_pass_used?: boolean;
    stage05_two_pass_batches?: number;
    stage05_overflow_policy?: "single_pass" | "two_pass" | null;
    fail_reason?: string | null;
    fail_class?: string | null;
    helix_ask_fail_reason?: string | null;
    helix_ask_fail_class?: string | null;
  };
};

export type HelixAskJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type HelixAskJobCreateResponse = {
  jobId: string;
  status: HelixAskJobStatus;
  sessionId?: string | null;
  traceId?: string | null;
};

export type HelixAskJobResponse = {
  jobId: string;
  status: HelixAskJobStatus;
  createdAt?: number;
  updatedAt?: number;
  expiresAt?: number;
  sessionId?: string | null;
  traceId?: string | null;
  partialText?: string | null;
  error?: string | null;
  result?: LocalAskResponse | null;
};

export type PendingHelixAskJob = {
  jobId: string;
  question?: string;
  sessionId?: string | null;
  traceId?: string | null;
  startedAt?: number;
};

export type MoodHintResponse = {
  mood: LumaMood | null;
  confidence: number;
  reason?: string | null;
  source?: string;
  durationMs?: number;
  traceId?: string;
  sessionId?: string | null;
  raw?: string | null;
};

export async function searchCodeLattice(
  query: string,
  limit = 12,
): Promise<KnowledgeProjectExport> {
  return asJson(
    await fetch("/api/code-lattice/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    }),
  );
}

export type ToolLogEvent = {
  id?: string;
  seq?: number;
  ts?: string;
  traceId?: string;
  sessionId?: string;
  tool?: string;
  ok?: boolean;
  text?: string;
  stage?: string;
  detail?: string;
  message?: string;
  meta?: Record<string, unknown>;
  debateId?: string;
  promptHash?: string;
  paramsHash?: string;
  durationMs?: number;
  stepId?: string;
  strategy?: string;
};

let reasoningTheaterConfigPromise: Promise<ReasoningTheaterConfigResponse> | null = null;
let reasoningTheaterTopologyPromise: Promise<ReasoningTheaterTopologyResponse> | null = null;
let reasoningTheaterAtlasGraphPromise: Promise<ReasoningTheaterAtlasGraphResponse> | null = null;
const reasoningTheaterCongruenceGraphPromiseByKey = new Map<
  string,
  Promise<ReasoningTheaterCongruenceGraphResponse>
>();
const contextCapsulePromiseByKey = new Map<string, Promise<ContextCapsuleLookupResponse>>();

export type ReasoningTheaterTopologyResponse = {
  version: string;
  generated_at: string;
  baseline: {
    owned_total: number;
    connected_owned: number;
    owned_not_connected: number;
    convergence_ratio: number;
  };
  sources: {
    owned_source: "git_tracked" | "code_lattice_fallback";
    connected_source: "atlas_corpus";
    atlas_unique_files: number;
    atlas_existing_files: number;
    degraded: boolean;
  };
  display: {
    node_density_mode: "dense";
    total_nodes: number;
    connected_nodes: number;
    frontier_nodes: number;
    uncharted_nodes: number;
    seed: number;
  };
};

export type ReasoningTheaterAtlasGraphResponse = {
  version: string;
  generated_at: string;
  seed: number;
  baseline: {
    owned_total: number;
    connected_owned: number;
    owned_not_connected: number;
    convergence_ratio: number;
  };
  stats: {
    nodes_total: number;
    edges_total: number;
    mapped_connected_nodes: number;
    owned_frontier_nodes: number;
    uncharted_nodes: number;
    degraded: boolean;
  };
  nodes: Array<{
    id: string;
    path: string;
    zone: "mapped_connected" | "owned_frontier";
    x: number;
    y: number;
    degree: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    weight: number;
  }>;
};

export type ReasoningTheaterCongruenceGraphResponse = {
  version: string;
  generated_at: string;
  seed: number;
  baseline: {
    owned_total: number;
    connected_owned: number;
    owned_not_connected: number;
    convergence_ratio: number;
  };
  stats: {
    trees_total: number;
    nodes_total: number;
    edges_total: number;
    mapped_connected_nodes: number;
    owned_frontier_nodes: number;
    uncharted_nodes: number;
    degraded: boolean;
  };
  trees: Array<{
    id: string;
    label: string;
    root_id: string | null;
    node_count: number;
  }>;
  nodes: Array<{
    id: string;
    tree_id: string;
    node_id: string;
    title: string;
    zone: "mapped_connected" | "owned_frontier";
    atlas_linked: boolean;
    x: number;
    y: number;
    degree: number;
    depth: number;
  }>;
  edges: Array<{
    id: string;
    tree_id: string;
    from: string;
    to: string;
    rel: string;
    edge_type: string;
    requires_cl: string | null;
    weight: number;
  }>;
};

export type ContextCapsuleLookupResponse = {
  capsule: ContextCapsuleSummary;
  replay_active: ContextCapsuleReplayBundle;
  replay_inactive: ContextCapsuleReplayBundle;
  convergence: {
    source: "atlas_exact" | "repo_exact" | "open_world" | "unknown";
    proofPosture: "confirmed" | "reasoned" | "hypothesis" | "unknown" | "fail_closed";
    maturity: "exploratory" | "reduced_order" | "diagnostic" | "certified";
    phase: "observe" | "plan" | "retrieve" | "gate" | "synthesize" | "verify" | "execute" | "debrief";
    collapseEvent: "arbiter_commit" | "proof_commit" | null;
  };
  intent: {
    intent_domain: string;
    intent_id: string;
    goal: string;
    constraints: string[];
    key_terms: string[];
  };
  provenance: {
    retrieval_route: string;
    zone_hint: "mapped_connected" | "owned_frontier" | "uncharted";
    has_exact_provenance: boolean;
    exact_paths: string[];
    primary_path: string | null;
    atlas_hits: number;
    channel_hits: Record<string, number>;
  };
  epistemic: {
    arbiter_mode: string;
    claim_tier: string;
    provenance_class: string;
    certifying: boolean;
    fail_reason: string | null;
  };
  commit: {
    events: Array<"arbiter_commit" | "proof_commit">;
    proof_verdict: "PASS" | "FAIL" | "UNKNOWN";
    certificate_hash: string | null;
    certificate_integrity_ok: boolean | null;
  };
};

export type PersonaSummary = {
  id: string;
  display_name: string;
};

export type DebateTurnPayload = {
  id: string;
  debate_id: string;
  round: number;
  role: "proponent" | "skeptic" | "referee";
  text: string;
  citations: string[];
  verifier_results: { name: string; ok: boolean; reason: string }[];
  created_at: string;
  essence_id?: string;
};

export type DebateScoreboard = {
  proponent: number;
  skeptic: number;
};

export type DebateRoundMetricsPayload = {
  round?: number;
  verifier_pass?: number;
  coverage?: number;
  stability?: number;
  novelty_gain?: number;
  score?: number;
  improvement?: number;
  flags?: number;
  tool_calls?: number;
  time_used_ms?: number;
  time_left_ms?: number;
};

export type DebateOutcomePayload = {
  debate_id: string;
  verdict: string;
  confidence: number;
  winning_role?: "proponent" | "skeptic";
  key_turn_ids: string[];
  rounds?: number;
  score?: number;
  stop_reason?: string;
  metrics?: DebateRoundMetricsPayload;
  created_at: string;
};

export type DebateSnapshot = {
  id: string;
  goal: string;
  persona_id: string;
  status: "pending" | "running" | "completed" | "timeout" | "aborted";
  config: {
    max_rounds: number;
    max_wall_ms: number;
    max_tool_calls: number;
    satisfaction_threshold: number;
    min_improvement: number;
    stagnation_rounds: number;
    novelty_epsilon: number;
    verifiers: string[];
  };
  created_at: string;
  updated_at: string;
  turns: DebateTurnPayload[];
  scoreboard: DebateScoreboard;
  outcome: DebateOutcomePayload | null;
  context?: Record<string, unknown> | null;
};

export type DebateStreamEvent =
  | {
      type: "turn";
      seq: number;
      debateId: string;
      turn: DebateTurnPayload;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "status";
      seq: number;
      debateId: string;
      status: DebateSnapshot["status"];
      scoreboard: DebateScoreboard;
      metrics?: DebateRoundMetricsPayload;
    }
  | {
      type: "outcome";
      seq: number;
      debateId: string;
      outcome: DebateOutcomePayload;
      scoreboard: DebateScoreboard;
      metrics?: DebateRoundMetricsPayload;
    };

export type DebateStartPayload = {
  goal: string;
  personaId: string;
  maxRounds?: number;
  maxWallMs?: number;
  verifiers?: string[];
};

export type DebateStartResponse = {
  debateId: string;
};

export type TraceMemoryHit = {
  id: string;
  kind: string;
  owner_id: string;
  created_at: string;
  keys: string[];
  snippet: string;
  essence_id?: string;
};

export type TraceMemoryResponse = {
  traceId: string;
  personaId: string;
  top_k: number;
  memories: TraceMemoryHit[];
  reflections: TraceMemoryHit[];
};

type PersonaListResponse = {
  personas: PersonaSummary[];
};

export type MemorySearchResponse = {
  items: TMemorySearchHit[];
  query?: string;
  top_k: number;
  debateOnly?: boolean;
};

export type PanelSnapshotResponse = {
  desktopId: string;
  capturedAt: string;
  panels: PanelTelemetry[];
  relatedPanels?: Array<{ id: string; title?: string }> | null;
  relationNotes?: string[] | null;
};

export type BadgeTelemetryResponse = BadgeTelemetrySnapshot;

export type VoiceSpeakPayload = {
  text: string;
  mode?: "callout" | "briefing" | "debrief";
  priority?: "info" | "warn" | "critical" | "action";
  provider?: string;
  voiceProfile?: string;
  voice_profile_id?: string;
  traceId?: string;
  missionId?: string;
  eventId?: string;
  contextTier?: "tier0" | "tier1";
  sessionState?: "idle" | "requesting" | "active" | "stopping" | "error";
  voiceMode?: "off" | "critical_only" | "normal" | "dnd";
  utteranceId?: string;
  chunkIndex?: number;
  chunkCount?: number;
  chunkKind?: "brief" | "final";
  turnKey?: string;
  dedupe_key?: string;
};

export type VoiceSpeakJsonResponse = {
  ok?: boolean;
  suppressed?: boolean;
  reason?: string;
  error?: string;
  message?: string;
  traceId?: string | null;
  details?: Record<string, unknown>;
};

export type VoiceSpeakResponse =
  | {
      kind: "json";
      status: number;
      payload: VoiceSpeakJsonResponse;
      headers: {
        provider: string | null;
        profile: string | null;
        cache: "hit" | "miss" | null;
        normalizationBenchmark: string | null;
        normalizationSkipReason: string | null;
      };
    }
  | {
      kind: "audio";
      status: number;
      mimeType: string;
      blob: Blob;
      headers: {
        provider: string | null;
        profile: string | null;
        cache: "hit" | "miss" | null;
        normalizationBenchmark: string | null;
        normalizationSkipReason: string | null;
      };
    };

export type VoiceTranscribeSegment = {
  text: string;
  start_ms?: number;
  end_ms?: number;
  confidence?: number;
};

export type HelixInterpreterDispatchState = "auto" | "confirm" | "blocked";

export type HelixInterpreterPivotCandidate = {
  text: string;
  confidence: number;
};

export type HelixInterpreterConceptCandidate = {
  concept_id: string;
  concept_label?: string;
  confidence: number;
  source: "concept_card" | "term_directory";
};

export type HelixInterpreterArtifact = {
  schema_version: "helix.interpreter.v1" | string;
  source_text: string;
  source_language: string;
  code_mixed: boolean;
  pivot_candidates: HelixInterpreterPivotCandidate[];
  selected_pivot: HelixInterpreterPivotCandidate;
  concept_candidates: HelixInterpreterConceptCandidate[];
  term_preservation: {
    ratio: number;
    missing_terms: string[];
  };
  ambiguity: {
    top2_gap: number;
    ambiguous: boolean;
  };
  term_ids: string[];
  concept_ids: string[];
  confirm_prompt: string | null;
  dispatch_state: HelixInterpreterDispatchState;
};

export type VoiceCommandLaneAction = "send" | "cancel" | "retry";
export type VoiceCommandLaneDecision = "accepted" | "suppressed" | "none";
export type VoiceCommandLaneSource = "parser" | "evaluator" | "none";
export type VoiceCommandLaneSuppressionReason =
  | "disabled"
  | "kill_switch"
  | "rollout_inactive"
  | "audio_quality_low"
  | "strict_prefix_required"
  | "log_only";

export type VoiceCommandLaneEnvelope = {
  version: "helix.voice.command_lane.v1" | string;
  decision: VoiceCommandLaneDecision;
  action: VoiceCommandLaneAction | null;
  confidence: number | null;
  source: VoiceCommandLaneSource;
  suppression_reason: VoiceCommandLaneSuppressionReason | null;
  strict_prefix_applied: boolean;
  confirm_required: boolean;
  utterance_id: string;
};

export type VoiceTranscribePayload = {
  audio: Blob;
  filename?: string;
  language?: string;
  traceId?: string;
  missionId?: string;
  durationMs?: number;
  speaker_id?: string;
  speaker_confidence?: number;
  speech_probability?: number;
  snr_db?: number;
  confirm_auto_eligible?: boolean;
  confirm_block_reason?: string;
};

export type VoiceTranscribeResponse = {
  ok?: boolean;
  text?: string;
  language?: string;
  language_detected?: string | null;
  language_confidence?: number | null;
  code_mixed?: boolean;
  duration_ms?: number;
  segments?: VoiceTranscribeSegment[];
  source_text?: string | null;
  source_language?: string | null;
  translated?: boolean;
  confidence?: number | null;
  confidence_reason?: string | null;
  pivot_confidence?: number | null;
  dispatch_state?: "auto" | "confirm" | "blocked";
  needs_confirmation?: boolean;
  translation_uncertain?: boolean;
  speaker_id?: string | null;
  speaker_confidence?: number | null;
  speech_probability?: number | null;
  snr_db?: number | null;
  confirm_auto_eligible?: boolean | null;
  confirm_block_reason?: string | null;
  lang_schema_version?: "helix.lang.v1" | string;
  traceId?: string | null;
  missionId?: string | null;
  engine?: string;
  essence_id?: string | null;
  interpreter?: HelixInterpreterArtifact | null;
  interpreter_schema_version?: "helix.interpreter.v1" | string | null;
  interpreter_status?:
    | "ok"
    | "timeout"
    | "parse_error"
    | "provider_error"
    | "disabled"
    | "skipped"
    | null;
  interpreter_confidence?: number | null;
  interpreter_dispatch_state?: HelixInterpreterDispatchState | null;
  interpreter_confirm_prompt?: string | null;
  interpreter_term_ids?: string[];
  interpreter_concept_ids?: string[];
  command_lane?: VoiceCommandLaneEnvelope | null;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
};

export type ConversationTurnClassification = {
  mode: "observe" | "act" | "verify" | "clarify";
  confidence: number;
  dispatch_hint: boolean;
  clarify_needed: boolean;
  reason: string;
  source?: "llm" | "fallback";
};

export type ConversationBrief = {
  text: string;
  source?: "llm" | "fallback" | "none";
};

export type ConversationDispatchDecision = {
  dispatch_hint: boolean;
  reason: string;
};

export type ConversationClarifierPolicy = "after_first_attempt";

export type ConversationExplorationPacket = {
  topic: string;
  goal: string;
  knowns: string[];
  unknowns: string[];
  evidence_needed: string[];
  next_probe: string;
};

export type ConversationTurnPayload = {
  transcript: string;
  sessionId?: string;
  traceId?: string;
  missionId?: string;
  personaId?: string;
  sourceLanguage?: string;
  languageDetected?: string;
  languageConfidence?: number;
  codeMixed?: boolean;
  pivotConfidence?: number;
  responseLanguage?: string;
  preferredResponseLanguage?: string;
  interpreter?: HelixInterpreterArtifact;
  interpreter_schema_version?: "helix.interpreter.v1" | string;
  multilangConfirm?: boolean;
  lang_schema_version?: "helix.lang.v1" | string;
  translated?: boolean;
  recentTurns?: string[];
};

export type ConversationTurnResponse = {
  ok?: boolean;
  traceId?: string | null;
  sessionId?: string | null;
  transcript?: string;
  source_language?: string | null;
  language_detected?: string | null;
  language_confidence?: number | null;
  code_mixed?: boolean;
  pivot_confidence?: number | null;
  response_language?: string | null;
  dispatch_state?: "auto" | "confirm" | "blocked";
  needs_confirmation?: boolean;
  interpreter_schema_version?: "helix.interpreter.v1" | string | null;
  interpreter_status?:
    | "ok"
    | "timeout"
    | "parse_error"
    | "provider_error"
    | "disabled"
    | "skipped"
    | null;
  interpreter_confidence?: number | null;
  interpreter_dispatch_state?: HelixInterpreterDispatchState | null;
  interpreter_confirm_prompt?: string | null;
  interpreter_term_ids?: string[];
  interpreter_concept_ids?: string[];
  interpreter_error?: string | null;
  lang_schema_version?: "helix.lang.v1" | string | null;
  translated?: boolean;
  classification?: ConversationTurnClassification;
  brief?: ConversationBrief;
  dispatch?: ConversationDispatchDecision;
  route_reason_code?: string;
  exploration_turn?: boolean;
  clarifier_policy?: ConversationClarifierPolicy;
  exploration_packet?: ConversationExplorationPacket;
  fail_reason?: string | null;
  durationMs?: number;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
};

async function asJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const preview = await response
      .text()
      .then((text) => text.trim().slice(0, 200))
      .catch(() => "");
    const base = `${response.status} ${response.statusText || "Non-JSON response"}`;
    const hint =
      typeof response.url === "string" && response.url.includes("/api/agi")
        ? " Ensure the AGI server routes are enabled (ENABLE_AGI=1)."
        : "";
    throw new Error(preview ? `${base}: ${preview}${hint}` : `${base}${hint}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const retryAfterHeader = response.headers.get("retry-after") ?? response.headers.get("Retry-After");
    let retryAfterMs: number | undefined;
    if (retryAfterHeader) {
      const asNumber = Number(retryAfterHeader);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        retryAfterMs = asNumber * 1000;
      } else {
        const asDate = Date.parse(retryAfterHeader);
        if (!Number.isNaN(asDate)) {
          const diff = asDate - Date.now();
          if (diff > 0) retryAfterMs = diff;
        }
      }
    }
    const baseMessage =
      (typeof (payload as any)?.message === "string" && (payload as any).message) ||
      (typeof (payload as any)?.error === "string" && (payload as any).error) ||
      `${response.status} ${response.statusText}`;
    let message = baseMessage;
    if ((payload as any)?.error === "voice_backend_error") {
      const firstAttempt = Array.isArray((payload as any)?.details?.attempts)
        ? (payload as any).details.attempts[0]
        : undefined;
      const attemptEngine =
        typeof firstAttempt?.engine === "string" && firstAttempt.engine.trim()
          ? firstAttempt.engine.trim()
          : "stt";
      const attemptMessage =
        typeof firstAttempt?.message === "string" && firstAttempt.message.trim()
          ? firstAttempt.message.trim()
          : "";
      if (attemptMessage) {
        message = `${baseMessage} (${attemptEngine}: ${attemptMessage})`;
      }
    }
    const error = new Error(message);
    (error as { status?: number }).status = response.status;
    const payloadRetry =
      typeof (payload as any)?.retryAfterMs === "number"
        ? (payload as any).retryAfterMs
        : undefined;
    const computedRetry = typeof payloadRetry === "number" ? payloadRetry : retryAfterMs;
    if (typeof computedRetry === "number" && Number.isFinite(computedRetry)) {
      (error as { retryAfterMs?: number }).retryAfterMs = computedRetry;
    }
    throw error;
  }

  return payload as T;
}

export async function speakVoice(
  payload: VoiceSpeakPayload,
  options?: { signal?: AbortSignal },
): Promise<VoiceSpeakResponse> {
  const response = await fetch("/api/voice/speak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, audio/wav, audio/mpeg",
    },
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
  const headerSnapshot = {
    provider: response.headers.get("x-voice-provider"),
    profile: response.headers.get("x-voice-profile"),
    cache: (response.headers.get("x-voice-cache")?.toLowerCase() as "hit" | "miss" | null) ?? null,
    normalizationBenchmark: response.headers.get("x-voice-normalization-benchmark"),
    normalizationSkipReason: response.headers.get("x-voice-normalization-skip-reason"),
  };
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    const json = (await response.json().catch(() => ({}))) as VoiceSpeakJsonResponse;
    return {
      kind: "json",
      status: response.status,
      payload: json,
      headers: headerSnapshot,
    };
  }
  const blob = await response.blob();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText || "Voice request failed"}`);
  }
  return {
    kind: "audio",
    status: response.status,
    mimeType: contentType || blob.type || "application/octet-stream",
    blob,
    headers: headerSnapshot,
  };
}

const extensionForAudioMime = (mimeType: string): string => {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized.includes("webm")) return "webm";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("mp4")) return "mp4";
  if (normalized.includes("wav") || normalized.includes("wave")) return "wav";
  return "webm";
};

export async function transcribeVoice(payload: VoiceTranscribePayload): Promise<VoiceTranscribeResponse> {
  const form = new FormData();
  const audioMimeType = payload.audio.type?.trim() || "audio/webm";
  const filename = payload.filename?.trim() || `helix-voice-input.${extensionForAudioMime(audioMimeType)}`;
  form.set("audio", payload.audio, filename);
  if (payload.language?.trim()) {
    form.set("language", payload.language.trim());
  }
  if (payload.traceId?.trim()) {
    form.set("traceId", payload.traceId.trim());
  }
  if (payload.missionId?.trim()) {
    form.set("missionId", payload.missionId.trim());
  }
  if (typeof payload.durationMs === "number" && Number.isFinite(payload.durationMs)) {
    form.set("durationMs", String(Math.max(0, Math.round(payload.durationMs))));
  }
  if (payload.speaker_id?.trim()) {
    form.set("speaker_id", payload.speaker_id.trim());
  }
  if (typeof payload.speaker_confidence === "number" && Number.isFinite(payload.speaker_confidence)) {
    form.set("speaker_confidence", String(payload.speaker_confidence));
  }
  if (typeof payload.speech_probability === "number" && Number.isFinite(payload.speech_probability)) {
    form.set("speech_probability", String(payload.speech_probability));
  }
  if (typeof payload.snr_db === "number" && Number.isFinite(payload.snr_db)) {
    form.set("snr_db", String(payload.snr_db));
  }
  if (typeof payload.confirm_auto_eligible === "boolean") {
    form.set("confirm_auto_eligible", payload.confirm_auto_eligible ? "1" : "0");
  }
  if (payload.confirm_block_reason?.trim()) {
    form.set("confirm_block_reason", payload.confirm_block_reason.trim());
  }

  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: form,
  });

  return asJson<VoiceTranscribeResponse>(response);
}

export async function runConversationTurn(
  payload: ConversationTurnPayload,
): Promise<ConversationTurnResponse> {
  const body: Record<string, unknown> = {
    transcript: payload.transcript,
  };
  if (payload.sessionId?.trim()) body.sessionId = payload.sessionId.trim();
  if (payload.traceId?.trim()) body.traceId = payload.traceId.trim();
  if (payload.missionId?.trim()) body.missionId = payload.missionId.trim();
  if (payload.personaId?.trim()) body.personaId = payload.personaId.trim();
  if (payload.sourceLanguage?.trim()) body.sourceLanguage = payload.sourceLanguage.trim();
  if (payload.languageDetected?.trim()) body.languageDetected = payload.languageDetected.trim();
  if (typeof payload.languageConfidence === "number" && Number.isFinite(payload.languageConfidence)) {
    body.languageConfidence = payload.languageConfidence;
  }
  if (typeof payload.codeMixed === "boolean") body.codeMixed = payload.codeMixed;
  if (typeof payload.pivotConfidence === "number" && Number.isFinite(payload.pivotConfidence)) {
    body.pivotConfidence = payload.pivotConfidence;
  }
  if (payload.responseLanguage?.trim()) body.responseLanguage = payload.responseLanguage.trim();
  if (payload.preferredResponseLanguage?.trim()) {
    body.preferredResponseLanguage = payload.preferredResponseLanguage.trim();
  }
  if (payload.interpreter) body.interpreter = payload.interpreter;
  if (payload.interpreter_schema_version?.trim()) {
    body.interpreter_schema_version = payload.interpreter_schema_version.trim();
  }
  if (typeof payload.multilangConfirm === "boolean") {
    body.multilangConfirm = payload.multilangConfirm;
  }
  if (payload.lang_schema_version?.trim()) body.lang_schema_version = payload.lang_schema_version.trim();
  if (typeof payload.translated === "boolean") body.translated = payload.translated;
  if (Array.isArray(payload.recentTurns) && payload.recentTurns.length > 0) {
    body.recentTurns = payload.recentTurns
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(-8);
  }
  const response = await fetch("/api/agi/ask/conversation-turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  return asJson<ConversationTurnResponse>(response);
}

export type PlanRequestOptions = {
  desktopId?: string;
  includeTelemetry?: boolean;
  promptSpec?: PromptSpec;
  collapseTrace?: CollapseDecision;
  collapseStrategy?: CollapseStrategyName;
  callSpec?: LocalCallSpec | null;
  essenceConsole?: boolean;
  warpParams?: Record<string, unknown>;
  sessionId?: string;
  refinery?: AgiRefineryRequest;
};

export async function plan(
  goal: string,
  personaId?: string,
  knowledgeContext?: KnowledgeProjectExport[],
  knowledgeProjects?: string[],
  options?: PlanRequestOptions,
): Promise<PlanResponse> {
  await ensureLatestLattice();
  const body: Record<string, unknown> = { goal, personaId };
  if (Array.isArray(knowledgeContext) && knowledgeContext.length > 0) {
    body.knowledgeContext = knowledgeContext;
  }
  if (Array.isArray(knowledgeProjects) && knowledgeProjects.length > 0) {
    body.knowledgeProjects = knowledgeProjects;
  }
  if (options?.promptSpec) {
    body.prompt_spec = options.promptSpec;
  }
  if (options?.collapseTrace) {
    body.collapse_trace = options.collapseTrace;
  }
  if (options?.collapseStrategy) {
    body.collapse_strategy = options.collapseStrategy;
  }
  if (options?.callSpec) {
    body.call_spec = options.callSpec;
  }
  if (options?.essenceConsole) {
    body.essenceConsole = true;
  }
  if (options?.warpParams) {
    body.warpParams = options.warpParams;
  }
  if (options?.sessionId) {
    body.sessionId = options.sessionId;
  }
  if (options?.refinery) {
    body.refinery = options.refinery;
  }
  const desktopId = options?.desktopId ?? DEFAULT_DESKTOP_ID;
  if (desktopId) {
    body.desktopId = desktopId;
  }
  if (options?.includeTelemetry !== false) {
    try {
      await pushConsoleTelemetry(desktopId);
    } catch (error) {
      console.warn("[agi] console telemetry push failed", error);
    }
  }
  const payload = await asJson<PlanResponse>(
    await fetch("/api/agi/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const latticeVersionValue =
    payload.lattice_version === null || payload.lattice_version === undefined
      ? null
      : Number.isFinite(Number(payload.lattice_version))
        ? Number(payload.lattice_version)
        : null;
  useResonanceStore.getState().setResonancePayload({
    bundle: payload.resonance_bundle ?? null,
    selection: payload.resonance_selection ?? null,
    latticeVersion: latticeVersionValue,
    traceId: payload.traceId,
  });
  return payload;
}

export async function execute(traceId: string): Promise<ExecuteResponse> {
  return asJson(
    await fetch("/api/agi/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId })
    })
  );
}

const HELIX_ASK_JOB_POLL_INTERVAL_MS = 1000;
const HELIX_ASK_JOB_MAX_CONSECUTIVE_ERRORS = 12;
const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const readNumberEnv = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};
const HELIX_ASK_JOB_TIMEOUT_MS = clampNumber(
  readNumberEnv(__HELIX_ASK_JOB_TIMEOUT_MS__, 1_200_000),
  30_000,
  30 * 60_000,
);

const isHelixAskJobUnsupported = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "helix_ask_jobs_unsupported",
  );

const buildAbortError = (): Error => {
  const error = new Error("Aborted");
  (error as { name?: string }).name = "AbortError";
  return error;
};

const isJobPollTransientError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const status = (error as { status?: number }).status;
  if (status === 429) return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("rate_limited") ||
    message.includes("too many requests") ||
    message.includes("failed to fetch") ||
    message.includes("failed to parse json") ||
    message.includes("non-json response") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("gateway") ||
    message.includes("service unavailable") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("520") ||
    message.includes("521") ||
    message.includes("522") ||
    message.includes("524") ||
    message.includes("socket hang up") ||
    message.includes("connection reset") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
};

const isJobMissingError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("not_found") || message.includes("404");
};

const HELIX_ASK_PENDING_JOB_KEY = "helixAsk.pendingJob.v1";
const HELIX_ASK_JOB_INTERRUPTED_FALLBACK_TEXT = "request interrupted. please try again.";

const readPendingHelixAskJob = (): PendingHelixAskJob | null => {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HELIX_ASK_PENDING_JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingHelixAskJob;
    if (!parsed || typeof parsed.jobId !== "string" || !parsed.jobId.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writePendingHelixAskJob = (payload: PendingHelixAskJob): void => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(HELIX_ASK_PENDING_JOB_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort persistence only.
  }
};

const clearPendingHelixAskJob = (jobId?: string): void => {
  if (typeof sessionStorage === "undefined") return;
  if (!jobId) {
    sessionStorage.removeItem(HELIX_ASK_PENDING_JOB_KEY);
    return;
  }
  const existing = readPendingHelixAskJob();
  if (!existing || existing.jobId === jobId) {
    sessionStorage.removeItem(HELIX_ASK_PENDING_JOB_KEY);
  }
};

const isNavigatorOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const isInterruptedJobFallbackResponse = (response: LocalAskResponse | null | undefined): boolean => {
  const text = typeof response?.text === "string" ? response.text.trim().toLowerCase() : "";
  return text === HELIX_ASK_JOB_INTERRUPTED_FALLBACK_TEXT;
};

const normalizeLocalAskResponse = (payload: unknown): LocalAskResponse => {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const rawText = typeof record.text === "string" ? record.text.trim() : "";
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const interpreterConfirmPrompt =
    typeof record.interpreter_confirm_prompt === "string" ? record.interpreter_confirm_prompt.trim() : "";
  const failReason = typeof record.fail_reason === "string" ? record.fail_reason : "";
  const failClass = typeof record.fail_class === "string" ? record.fail_class : "";
  const blockedByGate =
    record.ok === false &&
    (record.error === "multilang_dispatch_blocked" ||
      record.error === "multilang_confirmation_required" ||
      failClass === "multilang_confidence_gate" ||
      /^HELIX_(?:INTERPRETER|MULTILANG)_/.test(failReason));
  const fallbackText = message || interpreterConfirmPrompt || (blockedByGate ? "Confirmation is required." : "");
  const text = rawText || fallbackText || "No final answer returned.";
  return {
    ...(record as LocalAskResponse),
    text,
  };
};

const askLocalDirect = async (
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<LocalAskResponse> => {
  const payload = await asJson<unknown>(
    await fetch("/api/agi/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  );
  return normalizeLocalAskResponse(payload);
};

const waitForOnline = async (signal?: AbortSignal): Promise<number> => {
  if (!isNavigatorOffline()) return 0;
  const startedAt = Date.now();
  await new Promise<void>((resolve, reject) => {
    const handleOnline = () => {
      cleanup();
      resolve();
    };
    const handleAbort = () => {
      cleanup();
      reject(buildAbortError());
    };
    const cleanup = () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
      signal?.removeEventListener("abort", handleAbort);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline, { once: true });
    }
    if (signal) {
      signal.addEventListener("abort", handleAbort, { once: true });
    }
  });
  return Date.now() - startedAt;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(buildAbortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });

const createAskJob = async (
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<HelixAskJobCreateResponse> => {
  const response = await fetch("/api/agi/ask/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (response.status === 404 || response.status === 405) {
    const error = new Error("Helix Ask job endpoint unavailable");
    (error as { code?: string }).code = "helix_ask_jobs_unsupported";
    throw error;
  }
  return asJson(response);
};

const getAskJob = async (
  jobId: string,
  signal?: AbortSignal,
): Promise<HelixAskJobResponse> =>
  asJson(
    await fetch(`/api/agi/ask/jobs/${encodeURIComponent(jobId)}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      cache: "no-store",
      signal,
    }),
  );

const pollAskJob = async (
  jobId: string,
  options?: { signal?: AbortSignal; pollIntervalMs?: number; timeoutMs?: number },
): Promise<LocalAskResponse> => {
  const pollInterval = Math.max(250, options?.pollIntervalMs ?? HELIX_ASK_JOB_POLL_INTERVAL_MS);
  const startedAt = Date.now();
  let timeoutDeadline =
    typeof options?.timeoutMs === "number"
      ? startedAt + Math.max(0, options.timeoutMs)
      : HELIX_ASK_JOB_TIMEOUT_MS > 0
        ? startedAt + HELIX_ASK_JOB_TIMEOUT_MS
        : Number.POSITIVE_INFINITY;
  let lastPartialText = "";
  let consecutiveErrors = 0;

  while (true) {
    if (options?.signal?.aborted) {
      throw buildAbortError();
    }
    if (isNavigatorOffline()) {
      const waited = await waitForOnline(options?.signal);
      timeoutDeadline += waited;
      continue;
    }
    let job: HelixAskJobResponse | null = null;
    try {
      job = await getAskJob(jobId, options?.signal);
      consecutiveErrors = 0;
      if (job.expiresAt && Number.isFinite(job.expiresAt)) {
        timeoutDeadline = Math.max(timeoutDeadline, job.expiresAt);
      }
    } catch (error) {
      if (options?.signal?.aborted) {
        throw buildAbortError();
      }
      if (isJobMissingError(error)) {
        const fallback = lastPartialText || "Request interrupted. Please try again.";
        return { text: fallback } as LocalAskResponse;
      }
      if (isNavigatorOffline()) {
        const waited = await waitForOnline(options?.signal);
        timeoutDeadline += waited;
        continue;
      }
      if (!isJobPollTransientError(error)) {
        throw error;
      }
      consecutiveErrors += 1;
      if (Date.now() > timeoutDeadline) {
        const fallback = lastPartialText || "Request timed out.";
        return { text: fallback } as LocalAskResponse;
      }
      const maxErrorsReached = consecutiveErrors >= HELIX_ASK_JOB_MAX_CONSECUTIVE_ERRORS;
      if (maxErrorsReached && Date.now() > timeoutDeadline) {
        const fallback = lastPartialText || "Request failed. Please try again.";
        return { text: fallback } as LocalAskResponse;
      }
      const retryAfterMs = (error as { retryAfterMs?: number }).retryAfterMs;
      const retryDelay =
        typeof retryAfterMs === "number" && Number.isFinite(retryAfterMs)
          ? Math.min(60_000, Math.max(pollInterval, retryAfterMs))
          : undefined;
      const backoffCap = maxErrorsReached ? 15_000 : 8000;
      const backoffBase = Math.min(backoffCap, pollInterval * Math.pow(2, Math.min(consecutiveErrors, 4)));
      const delay = retryDelay ?? backoffBase * (0.75 + Math.random() * 0.5);
      await sleep(delay, options?.signal);
      continue;
    }
    if (job.partialText) {
      lastPartialText = job.partialText.trim();
    }
    if (job.status === "completed") {
      if (job.result) return normalizeLocalAskResponse(job.result);
      return { text: lastPartialText } as LocalAskResponse;
    }
    if (job.status === "failed" || job.status === "cancelled") {
      const message = job.error?.trim() || "Helix Ask job failed.";
      if (message.includes("helix_ask_timeout")) {
        const fallback = lastPartialText || "Request timed out.";
        return { text: fallback } as LocalAskResponse;
      }
      throw new Error(message);
    }
    if (Date.now() > timeoutDeadline) {
      const fallback = lastPartialText || "Request timed out.";
      return { text: fallback } as LocalAskResponse;
    }
    await sleep(pollInterval, options?.signal);
  }
};

export const getPendingHelixAskJob = (): PendingHelixAskJob | null =>
  readPendingHelixAskJob();

export const resumeHelixAskJob = async (
  jobId: string,
  options?: { signal?: AbortSignal; pollIntervalMs?: number; timeoutMs?: number },
): Promise<LocalAskResponse> => {
  try {
    return await pollAskJob(jobId, options);
  } finally {
    clearPendingHelixAskJob(jobId);
  }
};

export async function askLocal(
  prompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    seed?: number;
    stop?: string | string[];
    sessionId?: string;
    traceId?: string;
    personaId?: string;
    question?: string;
    sourceQuestion?: string;
    sourceLanguage?: string;
    languageDetected?: string;
    languageConfidence?: number;
    codeMixed?: boolean;
    pivotConfidence?: number;
    translated?: boolean;
    responseLanguage?: string;
    preferredResponseLanguage?: string;
    interpreter?: HelixInterpreterArtifact;
    interpreter_schema_version?: "helix.interpreter.v1" | string;
    multilangConfirm?: boolean;
    lang_schema_version?: "helix.lang.v1" | string;
    debug?: boolean;
    verbosity?: "brief" | "normal" | "extended";
    searchQuery?: string;
    topK?: number;
    context?: string;
    signal?: AbortSignal;
    mode?: "read" | "observe" | "act" | "verify";
    allowTools?: string[];
    requiredEvidence?: string[];
    verify?: { mode?: "constraint-pack" | "agent-loop"; packId?: string };
    place?: HaloBankPlace;
    timestamp?: string | number;
    durationMs?: number;
    compare?: { place?: HaloBankPlace; timestamp?: string | number; durationMs?: number };
    model?: { includeEnvelope?: boolean; includeCausal?: boolean };
    capsuleIds?: string[];
    dialogue_profile?: "dot_min_steps_v1";
  },
): Promise<LocalAskResponse> {
  const body: Record<string, unknown> = {};
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const promptQuestionMatch =
    typeof prompt === "string"
      ? prompt.match(/(?:^|\n)Question:\s*([^\n]+)/i)?.[1]?.trim()
      : "";
  if (trimmedPrompt) {
    body.prompt = prompt;
  }
  if (typeof options?.maxTokens === "number") body.max_tokens = options.maxTokens;
  if (typeof options?.temperature === "number") body.temperature = options.temperature;
  if (typeof options?.seed === "number") body.seed = options.seed;
  if (options?.stop) body.stop = options.stop;
  if (options?.sessionId) body.sessionId = options.sessionId;
  if (options?.traceId) body.traceId = options.traceId;
  if (options?.personaId) body.personaId = options.personaId;
  if (options?.question) body.question = options.question;
  else if (promptQuestionMatch) body.question = promptQuestionMatch;
  else if (trimmedPrompt) body.question = trimmedPrompt;
  if (typeof options?.sourceQuestion === "string" && options.sourceQuestion.trim()) {
    body.sourceQuestion = options.sourceQuestion.trim();
  }
  if (typeof options?.sourceLanguage === "string" && options.sourceLanguage.trim()) {
    body.sourceLanguage = options.sourceLanguage.trim();
  }
  if (typeof options?.languageDetected === "string" && options.languageDetected.trim()) {
    body.languageDetected = options.languageDetected.trim();
  }
  if (typeof options?.languageConfidence === "number" && Number.isFinite(options.languageConfidence)) {
    body.languageConfidence = options.languageConfidence;
  }
  if (typeof options?.codeMixed === "boolean") {
    body.codeMixed = options.codeMixed;
  }
  if (typeof options?.pivotConfidence === "number" && Number.isFinite(options.pivotConfidence)) {
    body.pivotConfidence = options.pivotConfidence;
  }
  if (typeof options?.translated === "boolean") {
    body.translated = options.translated;
  }
  if (typeof options?.responseLanguage === "string" && options.responseLanguage.trim()) {
    body.responseLanguage = options.responseLanguage.trim();
  }
  if (
    typeof options?.preferredResponseLanguage === "string" &&
    options.preferredResponseLanguage.trim()
  ) {
    body.preferredResponseLanguage = options.preferredResponseLanguage.trim();
  }
  if (options?.interpreter) {
    body.interpreter = options.interpreter;
  }
  if (typeof options?.interpreter_schema_version === "string" && options.interpreter_schema_version.trim()) {
    body.interpreter_schema_version = options.interpreter_schema_version.trim();
  }
  if (typeof options?.multilangConfirm === "boolean") {
    body.multilangConfirm = options.multilangConfirm;
  }
  if (typeof options?.lang_schema_version === "string" && options.lang_schema_version.trim()) {
    body.lang_schema_version = options.lang_schema_version.trim();
  }
  if (typeof options?.debug === "boolean") body.debug = options.debug;
  if (options?.verbosity) body.verbosity = options.verbosity;
  if (typeof options?.searchQuery === "string" && options.searchQuery.trim()) {
    body.searchQuery = options.searchQuery.trim();
  }
  if (typeof options?.topK === "number") body.topK = options.topK;
  if (typeof options?.context === "string" && options.context.trim()) {
    body.context = options.context;
  }
  if (options?.mode) body.mode = options.mode;
  if (options?.allowTools?.length) body.allowTools = options.allowTools;
  if (options?.requiredEvidence?.length) body.requiredEvidence = options.requiredEvidence;
  if (options?.verify) body.verify = options.verify;
  if (options?.place) body.place = options.place;
  if (options?.timestamp !== undefined) body.timestamp = options.timestamp;
  if (typeof options?.durationMs === "number") body.durationMs = options.durationMs;
  if (options?.compare) body.compare = options.compare;
  if (options?.model) body.model = options.model;
  if (Array.isArray(options?.capsuleIds) && options.capsuleIds.length > 0) {
    body.capsuleIds = options.capsuleIds.slice(0, HELIX_CONTEXT_CAPSULE_MAX_IDS);
  }
  if (options?.dialogue_profile) {
    body.dialogue_profile = options.dialogue_profile;
  }
  const signal = options?.signal;
  if (isNavigatorOffline()) {
    await waitForOnline(signal);
  }
  try {
    const job = await createAskJob(body, signal);
    const question = typeof body.question === "string" ? body.question : undefined;
    writePendingHelixAskJob({
      jobId: job.jobId,
      question,
      sessionId: job.sessionId ?? options?.sessionId ?? null,
      traceId: job.traceId ?? options?.traceId ?? null,
      startedAt: Date.now(),
    });
    try {
      const result = await pollAskJob(job.jobId, { signal });
      if (!signal?.aborted && isInterruptedJobFallbackResponse(result)) {
        return await askLocalDirect(body, signal);
      }
      return result;
    } finally {
      clearPendingHelixAskJob(job.jobId);
    }
  } catch (error) {
    if (isNavigatorOffline()) {
      await waitForOnline(signal);
      const job = await createAskJob(body, signal);
      const question = typeof body.question === "string" ? body.question : undefined;
      writePendingHelixAskJob({
        jobId: job.jobId,
        question,
        sessionId: job.sessionId ?? options?.sessionId ?? null,
        traceId: job.traceId ?? options?.traceId ?? null,
        startedAt: Date.now(),
      });
      try {
        const result = await pollAskJob(job.jobId, { signal });
        if (!signal?.aborted && isInterruptedJobFallbackResponse(result)) {
          return await askLocalDirect(body, signal);
        }
        return result;
      } finally {
        clearPendingHelixAskJob(job.jobId);
      }
    }
    if (!isHelixAskJobUnsupported(error)) {
      throw error;
    }
  }
  if (isNavigatorOffline()) {
    await waitForOnline(signal);
  }
  return await askLocalDirect(body, signal);
}

export async function askMoodHint(
  text: string,
  options?: { sessionId?: string; personaId?: string; signal?: AbortSignal },
): Promise<MoodHintResponse> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return { mood: null, confidence: 0 };
  }
  const body: Record<string, unknown> = { text: trimmed };
  if (options?.sessionId) body.sessionId = options.sessionId;
  if (options?.personaId) body.personaId = options.personaId;
  return asJson(
    await fetch("/api/agi/mood-hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    }),
  );
}

export function subscribeToolLogs(
  onEvent: (event: ToolLogEvent) => void,
  options?: { tool?: string; sessionId?: string; traceId?: string; limit?: number },
): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  const params = new URLSearchParams();
  if (options?.tool) params.set("tool", options.tool);
  if (options?.sessionId) params.set("sessionId", options.sessionId);
  if (options?.traceId) params.set("traceId", options.traceId);
  if (typeof options?.limit === "number") params.set("limit", String(options.limit));
  const url = params.toString()
    ? `/api/agi/tools/logs/stream?${params.toString()}`
    : "/api/agi/tools/logs/stream";
  const source = new EventSource(url);
  source.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data) as ToolLogEvent);
    } catch {
      /* ignore malformed events */
    }
  };
  source.onerror = () => {
    /* best-effort stream, do nothing on error */
  };
  return () => {
    source.close();
  };
}

export async function getReasoningTheaterConfig(
  options?: { forceRefresh?: boolean },
): Promise<ReasoningTheaterConfigResponse> {
  if (!options?.forceRefresh && reasoningTheaterConfigPromise) {
    return reasoningTheaterConfigPromise;
  }
  reasoningTheaterConfigPromise = (async () => {
    try {
      const response = await fetch("/api/helix/reasoning-theater/config", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`reasoning-theater-config-http-${response.status}`);
      }
      const payload = (await response.json()) as unknown;
      return parseReasoningTheaterConfigPayload(payload);
    } catch {
      return getDefaultReasoningTheaterConfig();
    }
  })();
  return reasoningTheaterConfigPromise;
}

export async function getReasoningTheaterTopology(
  options?: { forceRefresh?: boolean },
): Promise<ReasoningTheaterTopologyResponse> {
  if (!options?.forceRefresh && reasoningTheaterTopologyPromise) {
    return reasoningTheaterTopologyPromise;
  }
  reasoningTheaterTopologyPromise = (async () => {
    const response = await fetch("/api/helix/reasoning-theater/topology", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`reasoning-theater-topology-http-${response.status}`);
    }
    const payload = (await response.json()) as ReasoningTheaterTopologyResponse;
    return payload;
  })().catch((error) => {
    reasoningTheaterTopologyPromise = null;
    throw error;
  });
  return reasoningTheaterTopologyPromise;
}

export async function getReasoningTheaterAtlasGraph(
  options?: { forceRefresh?: boolean },
): Promise<ReasoningTheaterAtlasGraphResponse> {
  if (!options?.forceRefresh && reasoningTheaterAtlasGraphPromise) {
    return reasoningTheaterAtlasGraphPromise;
  }
  reasoningTheaterAtlasGraphPromise = (async () => {
    const response = await fetch("/api/helix/reasoning-theater/atlas-graph", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`reasoning-theater-atlas-graph-http-${response.status}`);
    }
    return (await response.json()) as ReasoningTheaterAtlasGraphResponse;
  })().catch((error) => {
    reasoningTheaterAtlasGraphPromise = null;
    throw error;
  });
  return reasoningTheaterAtlasGraphPromise;
}

export async function getReasoningTheaterCongruenceGraph(options?: {
  forceRefresh?: boolean;
  treeIds?: string[];
  primaryTreeId?: string | null;
}): Promise<ReasoningTheaterCongruenceGraphResponse> {
  const treeIds = Array.isArray(options?.treeIds)
    ? Array.from(
        new Set(
          options.treeIds
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean)
            .map((entry) => entry.toLowerCase()),
        ),
      )
    : [];
  const primaryTreeId =
    typeof options?.primaryTreeId === "string" && options.primaryTreeId.trim().length > 0
      ? options.primaryTreeId.trim().toLowerCase()
      : "";
  const cacheKey = `${treeIds.join(",")}|${primaryTreeId}`;
  if (!options?.forceRefresh) {
    const cached = reasoningTheaterCongruenceGraphPromiseByKey.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  const promise = (async () => {
    const search = new URLSearchParams();
    if (treeIds.length > 0) {
      search.set("treeIds", treeIds.join(","));
    }
    if (primaryTreeId) {
      search.set("primaryTreeId", primaryTreeId);
    }
    const query = search.toString();
    const response = await fetch(
      query
        ? `/api/helix/reasoning-theater/congruence-graph?${query}`
        : "/api/helix/reasoning-theater/congruence-graph",
      {
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) {
      throw new Error(`reasoning-theater-congruence-graph-http-${response.status}`);
    }
    return (await response.json()) as ReasoningTheaterCongruenceGraphResponse;
  })().catch((error) => {
    reasoningTheaterCongruenceGraphPromiseByKey.delete(cacheKey);
    throw error;
  });
  reasoningTheaterCongruenceGraphPromiseByKey.set(cacheKey, promise);
  return promise;
}

export async function getContextCapsule(
  capsuleId: string,
  options?: { sessionId?: string; signal?: AbortSignal; forceRefresh?: boolean },
): Promise<ContextCapsuleLookupResponse> {
  const normalized = capsuleId.trim().toUpperCase();
  if (!normalized) {
    throw new Error("capsule_id_required");
  }
  const cacheKey = `${normalized}|${options?.sessionId ?? ""}`;
  if (!options?.forceRefresh) {
    const cached = contextCapsulePromiseByKey.get(cacheKey);
    if (cached) return cached;
  }
  const promise = (async () => {
    const search = new URLSearchParams();
    if (options?.sessionId) {
      search.set("sessionId", options.sessionId);
    }
    const query = search.toString();
    const response = await fetch(
      query
        ? `/api/helix/capsule/${encodeURIComponent(normalized)}?${query}`
        : `/api/helix/capsule/${encodeURIComponent(normalized)}`,
      {
        headers: { Accept: "application/json" },
        signal: options?.signal,
      },
    );
    if (!response.ok) {
      throw new Error(`context-capsule-http-${response.status}`);
    }
    return (await response.json()) as ContextCapsuleLookupResponse;
  })().catch((error) => {
    contextCapsulePromiseByKey.delete(cacheKey);
    throw error;
  });
  contextCapsulePromiseByKey.set(cacheKey, promise);
  return promise;
}

export async function syncKnowledgeProjects(
  projects: KnowledgeProjectExport[],
): Promise<{ synced: number; projectIds: string[] }> {
  if (!Array.isArray(projects) || projects.length === 0) {
    return { synced: 0, projectIds: [] };
  }
  const payload = await asJson<{ synced: number; projectIds: string[]; skipped?: string }>(
    await fetch("/api/knowledge/projects/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projects }),
    }),
  );
  if (payload.skipped) {
    return { synced: 0, projectIds: [] };
  }
  return payload;
}

export async function getTraceMemories(traceId: string, k = 10): Promise<TraceMemoryResponse> {
  const search = new URLSearchParams({ k: String(k) });
  return asJson(
    await fetch(`/api/agi/memory/by-trace/${encodeURIComponent(traceId)}?${search.toString()}`, {
      headers: { Accept: "application/json" }
    })
  );
}

export type MemorySearchParams = {
  q: string;
  k?: number;
  personaId?: string;
  debateOnly?: boolean;
};

export async function memorySearch({
  q,
  k = 10,
  personaId,
  debateOnly = false,
}: MemorySearchParams): Promise<MemorySearchResponse> {
  const search = new URLSearchParams();
  search.set("q", q);
  if (k) search.set("k", String(k));
  if (personaId) search.set("owner", personaId);
  if (debateOnly) search.set("debateOnly", "1");
  return asJson(
    await fetch(`/api/agi/memory/search?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function listChatSessions(opts?: {
  limit?: number;
  offset?: number;
  includeMessages?: boolean;
}): Promise<ChatSession[]> {
  const params = new URLSearchParams();
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit));
  if (typeof opts?.offset === "number") params.set("offset", String(opts.offset));
  if (opts?.includeMessages === false) params.set("includeMessages", "0");
  const suffix = params.toString();
  const payload = await asJson<{ sessions?: ChatSession[] }>(
    await fetch(`/api/agi/chat/sessions${suffix ? `?${suffix}` : ""}`, {
      headers: { Accept: "application/json" },
    }),
  );
  return payload.sessions ?? [];
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  if (!id) return null;
  const payload = await asJson<{ session?: ChatSession }>(
    await fetch(`/api/agi/chat/sessions/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    }),
  );
  return payload.session ?? null;
}

export async function upsertChatSession(session: ChatSession): Promise<ChatSession> {
  const payload = await asJson<{ session: ChatSession }>(
    await fetch("/api/agi/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    }),
  );
  return payload.session;
}

export async function deleteChatSession(id: string): Promise<void> {
  if (!id) return;
  await asJson(
    await fetch(`/api/agi/chat/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    }),
  );
}

export async function listPersonas(): Promise<PersonaSummary[]> {
  const payload = await asJson<PersonaListResponse>(
    await fetch("/api/agi/persona/list", {
      headers: { Accept: "application/json" }
    })
  ).catch((error) => {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  });
  if (!payload || !Array.isArray(payload.personas)) {
    return [];
  }
  return payload.personas;
}

export async function startDebateSession(payload: DebateStartPayload): Promise<DebateStartResponse> {
  const body: Record<string, unknown> = {
    goal: payload.goal,
    persona_id: payload.personaId,
  };
  if (Number.isFinite(payload.maxRounds)) {
    body.max_rounds = payload.maxRounds;
  }
  if (Number.isFinite(payload.maxWallMs)) {
    body.max_wall_ms = payload.maxWallMs;
  }
  if (Array.isArray(payload.verifiers) && payload.verifiers.length > 0) {
    body.verifiers = payload.verifiers.map((name) => name?.toString().trim()).filter((name) => !!name);
  }
  return asJson(
    await fetch("/api/agi/debate/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
}

export async function getDebateStatus(debateId: string): Promise<DebateSnapshot> {
  return asJson(
    await fetch(`/api/agi/debate/${encodeURIComponent(debateId)}`, {
      headers: { Accept: "application/json" }
    })
  );
}

export async function getPanelSnapshots(params: { desktopId?: string; panelIds?: string[] } = {}): Promise<PanelSnapshotResponse> {
  const search = new URLSearchParams();
  if (params.desktopId) {
    search.set("desktopId", params.desktopId);
  }
  if (params.panelIds && params.panelIds.length > 0) {
    search.set("panelIds", params.panelIds.join(","));
  }
  return asJson(
    await fetch(`/api/agi/telemetry/panels?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function getBadgeTelemetry(params: { desktopId?: string; includeRaw?: boolean } = {}): Promise<BadgeTelemetryResponse> {
  const search = new URLSearchParams();
  if (params.desktopId) {
    search.set("desktopId", params.desktopId);
  }
  if (params.includeRaw) {
    search.set("includeRaw", "1");
  }
  return asJson(
    await fetch(`/api/agi/telemetry/badges?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function fetchEssenceProfile(
  essenceId: string,
  options?: { stateless?: boolean },
): Promise<EssenceProfile | null> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch essence profile");
  }
  const json = (await res.json()) as { profile?: EssenceProfile | null };
  return json.profile ?? null;
}

export async function updateEssenceProfile(
  essenceId: string,
  update: EssenceProfileUpdate,
  options?: { stateless?: boolean },
): Promise<EssenceProfile> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update ?? {}),
  });
  if (!res.ok) {
    throw new Error("Failed to update essence profile");
  }
  const json = (await res.json()) as { profile: EssenceProfile };
  return json.profile;
}

export async function resetEssenceProfile(
  essenceId: string,
  options?: { stateless?: boolean },
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to reset essence profile");
  }
}

export type DebateStreamHandlers = {
  onEvent?: (event: DebateStreamEvent) => void;
  onError?: (event: Event) => void;
};

type EventPayload<T extends DebateStreamEvent["type"]> = Omit<Extract<DebateStreamEvent, { type: T }>, "type">;

const parseEventPayload = <T extends DebateStreamEvent["type"]>(event: Event): EventPayload<T> | null => {
  try {
    const data = JSON.parse((event as MessageEvent<string>).data || "{}") as EventPayload<T>;
    return data;
  } catch {
    return null;
  }
};

export function connectDebateStream(debateId: string, handlers: DebateStreamHandlers = {}): () => void {
  if (!debateId || typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  const params = new URLSearchParams({ debateId });
  const source = new EventSource(`/api/agi/debate/stream?${params.toString()}`);
  const dispatch = <T extends DebateStreamEvent["type"]>(type: T) => (event: Event) => {
    const payload = parseEventPayload<T>(event);
    if (!payload) return;
    handlers.onEvent?.({ ...payload, type } as Extract<DebateStreamEvent, { type: T }>);
  };
  const handleTurn = dispatch("turn");
  const handleStatus = dispatch("status");
  const handleOutcome = dispatch("outcome");
  source.addEventListener("turn", handleTurn);
  source.addEventListener("status", handleStatus);
  source.addEventListener("outcome", handleOutcome);
  source.onerror = (event) => {
    handlers.onError?.(event);
  };
  return () => {
    source.removeEventListener("turn", handleTurn);
    source.removeEventListener("status", handleStatus);
    source.removeEventListener("outcome", handleOutcome);
    source.close();
  };
}
