import crypto from "node:crypto";
import {
  HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  type HelixCommittedAskRoute,
  type HelixCommittedAskRouteCompatibilityResult,
  type HelixRouteEvidenceAuthority,
  type HelixRouteEvidenceAuthorityTool,
  type HelixCommittedAskRouteToolAdmissionResult,
} from "@shared/helix-committed-ask-route";
import type { HelixPromptInterpretation } from "./prompt-interpretation";
import type { HelixIntentArbitration } from "./intent-arbitration";
import { applyCompoundTerminalPolicy } from "./compound-terminal-policy";
import { buildToolUseRestatement } from "./internet-search-intent";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = (entries: string[]): string[] => Array.from(new Set(entries.filter(Boolean)));

const uniqueTools = (entries: HelixRouteEvidenceAuthorityTool[]): HelixRouteEvidenceAuthorityTool[] => {
  const seen = new Set<string>();
  const result: HelixRouteEvidenceAuthorityTool[] = [];
  for (const entry of entries) {
    const capabilityId = readString(entry.capability_id);
    const family = readString(entry.family);
    if (!capabilityId && !family) continue;
    const key = `${capabilityId || "family"}:${family || "unknown"}:${entry.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...entry, capability_id: capabilityId || family, family: family || "unknown" });
  }
  return result;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const MODEL_ONLY_TERMINAL_ALIASES = new Set([
  "direct_answer_text",
  "model_synthesized_answer",
  "final_answer_draft",
]);

const MODEL_ONLY_FORBIDDEN_SOURCE_TERMINALS = [
  "docs_viewer_receipt",
  "doc_open_receipt",
  "doc_summary",
  "active_doc_identity",
  "doc_location_result",
  "doc_location_matches",
  "doc_evidence_location",
  "doc_evidence_synthesis",
  "doc_evidence_synthesis_answer",
  "repo_code_evidence_answer",
];

const DOCS_MARKDOWN_PATH_RE = /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+\.md\b/i;

export const normalizeCommittedRouteTerminalKind = (kind: string | null | undefined): string => {
  const normalized = readString(kind).toLowerCase();
  if (normalized === "model_direct_answer" || normalized === "model_only_concept") return "direct_answer_text";
  if (normalized === "answer_draft") return "final_answer_draft";
  if (normalized === "doc_evidence_synthesis") return "doc_evidence_synthesis_answer";
  return normalized;
};

const sourceBackedTargets = new Set([
  "visual_capture",
  "procedure_memory",
  "conversation_memory",
  "situation_epoch",
  "visual_scene_memory",
  "repo_code",
  "runtime_evidence",
  "workspace_directory",
  "workspace_diagnostic",
  "theory_locator",
  "context_reflection",
  "docs_viewer",
  "active_doc",
  "internet_search",
  "scholarly_research",
  "process_graph",
  "live_pipeline",
  "live_environment",
  "live_source_mailbox",
  "world_event",
  "active_note",
]);

export const inferCommittedRouteToolFamily = (capabilityId: string): string => {
  if (/docs[_-]?viewer|docs-viewer|doc[_-]?viewer/i.test(capabilityId)) return "docs_viewer";
  if (/scholarly[-_.]?research|lookup[_-]?papers|fetch[_-]?full[_-]?text|semantic[-_.]?scholar|openalex|pubmed|crossref/i.test(capabilityId)) return "scholarly_research";
  if (/internet[-_.]?search|web[-_.]?research|web\.search/i.test(capabilityId)) return "internet_search";
  if (/text[-_.]?to[-_.]?speech|speak[_-]?text|voice[-_.]?delivery|voice[-_.]?output|request[_-]?interim[_-]?voice[_-]?callout|narrator[_-]?say/i.test(capabilityId)) return "voice_delivery";
  if (/scientific[-_.]?calculator|calculator|calculate|compute|solve/i.test(capabilityId)) return "scientific_calculator";
  if (/^live_env\./i.test(capabilityId)) return "live_environment";
  if (/^situation-room\.live-source\.|^situation-room\.pipeline\./i.test(capabilityId)) return "live_pipeline";
  if (/process[-_.]?graph/i.test(capabilityId)) return "process_graph";
  if (/workspace[-_.]?directory/i.test(capabilityId)) return "workspace_directory";
  if (/workspace[_-]?os|workspace_diagnostic/i.test(capabilityId)) return "workspace_diagnostic";
  if (/inspect[_-]?capability[_-]?catalog|capability[_-]?catalog|tool[_-]?alignment/i.test(capabilityId)) return "capability_catalog";
  if (/reflect[_-]?ideology[_-]?context|bridge[_-]?theory[_-]?ideology|moral[-_.]?graph|ideology_context_reflection/i.test(capabilityId)) return "moral_graph_reflection";
  if (/civilization[-_.]?bounds|civilization[-_.]?scenario|reflect[_-]?civilization|build[_-]?civilization/i.test(capabilityId)) return "civilization_bounds";
  if (/reflect[_-]?context[_-]?attachments|reflect[_-]?live[_-]?synthetic[_-]?data|context[_-]?reflection/i.test(capabilityId)) return "context_reflection";
  if (/click|open|close|panel|workspace-action|workspace_action/i.test(capabilityId)) return "workstation_action";
  if (/workstation-notes|note/i.test(capabilityId)) return "notes";
  if (/repo|code|source-tree/i.test(capabilityId)) return "repo_code";
  if (/theory[-_.]?locator|badge[_-]?graph|theory/i.test(capabilityId)) return "theory_locator";
  if (/model\.direct_answer|direct_answer|no_tool/i.test(capabilityId)) return "model_only";
  return "unknown";
};

const familyForSourceTarget = (sourceTarget: string): string => {
  if (sourceTarget === "docs_viewer" || sourceTarget === "active_doc") return "docs_viewer";
  if (sourceTarget === "repo_code" || sourceTarget === "runtime_evidence") return "repo_code";
  if (sourceTarget === "internet_search" || sourceTarget === "world_event") return "internet_search";
  if (sourceTarget === "scholarly_research") return "scholarly_research";
  if (sourceTarget === "live_environment" || sourceTarget === "live_source_mailbox") return "live_environment";
  if (sourceTarget === "live_pipeline") return "live_pipeline";
  if (sourceTarget === "process_graph") return "process_graph";
  if (sourceTarget === "workspace_directory") return "workspace_directory";
  if (sourceTarget === "workspace_diagnostic") return "workspace_diagnostic";
  if (sourceTarget === "theory_locator") return "theory_locator";
  if (sourceTarget === "context_reflection") return "context_reflection";
  if (sourceTarget === "calculator_stream") return "scientific_calculator";
  if (sourceTarget === "active_note") return "notes";
  if (sourceTarget === "workstation_state" || sourceTarget === "workstation_panel" || sourceTarget === "workspace_panel") return "workstation_action";
  if (sourceTarget === "visual_capture" || sourceTarget === "situation_epoch" || sourceTarget === "visual_scene_memory") return "visual_capture";
  if (sourceTarget === "procedure_memory") return "procedure_memory";
  if (sourceTarget === "conversation_memory") return "conversation_memory";
  return "";
};

const readCanonicalGoal = (payload: RecordLike): { goalKind: string; requiredTerminalKind: string } => {
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const universalGoalFrame = readRecord(payload.universal_goal_frame);
  const universalUserGoal = readRecord(universalGoalFrame?.user_goal);
  return {
    goalKind:
      readString(canonicalGoalFrame?.goal_kind) ||
      readString(universalGoalFrame?.goal_kind) ||
      readString(universalUserGoal?.goal_kind) ||
      "unknown",
    requiredTerminalKind:
      readString(canonicalGoalFrame?.required_terminal_kind) ||
      readString(universalGoalFrame?.required_terminal_kind) ||
      readString(universalUserGoal?.required_terminal_kind) ||
      "unknown",
  };
};

const readRouteSource = (payload: RecordLike): {
  sourceTarget: string;
  targetKind: string;
  strength: "hard" | "soft" | "unknown";
  reason: string;
} => {
  const committed = readCommittedAskRoute(payload);
  if (committed) {
    return {
      sourceTarget: committed.route.source_target,
      targetKind: committed.route.target_kind,
      strength: committed.route.strength,
      reason: committed.route.route_reason,
    };
  }
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeContract = readRecord(payload.route_product_contract);
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  if (readString(canonicalGoalFrame?.goal_kind) === "note_mutation") {
    return {
      sourceTarget: "active_note",
      targetKind: "active_note",
      strength: "hard",
      reason: "canonical_goal_note_mutation",
    };
  }
  const strength = readString(sourceTargetIntent?.strength);
  return {
    sourceTarget: readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown",
    targetKind:
      readString(sourceTargetIntent?.target_kind) ||
      readString(sourceTargetIntent?.target_source) ||
      readString(routeContract?.source_target) ||
      "unknown",
    strength: strength === "hard" || strength === "soft" ? strength : "unknown",
    reason: readString(sourceTargetIntent?.precedence_reason) || readString(routeContract?.precedence_reason) || "source_target_admission_trace",
  };
};

const readWorkspaceActiveDocPath = (payload: RecordLike): string => {
  const snapshot =
    readRecord(payload.workspace_context_snapshot) ??
    readRecord(readRecord(payload.ask_turn_preflight_context)?.workspace_snapshot);
  return readString(snapshot?.activeDocPath) || readString(snapshot?.docContextPath);
};

const promptSuppressionMentions = (promptInterpretation?: HelixPromptInterpretation | null): HelixCommittedAskRoute["suppression"]["contextual_tool_mentions"] =>
  (promptInterpretation?.contextual_tool_mentions ?? []).map((mention) => ({
    text: mention.text,
    verb_or_cue: mention.verb_or_cue,
    reason: mention.reason,
  }));

const suppressedFamiliesFromPayload = (
  payload: RecordLike,
  promptInterpretation?: HelixPromptInterpretation | null,
): string[] => {
  const fromAdmission = readStringArray(readRecord(payload.tool_call_admission_decision)?.suppressed_tool_families);
  const fromContextualAudit = readStringArray(readRecord(payload.contextual_tool_audit)?.blocked_families);
  const fromSolverTrace = readStringArray(readRecord(readRecord(payload.ask_turn_solver_trace)?.contextual_tool_audit)?.blocked_families);
  const inferredFromPrompt = (promptInterpretation?.contextual_tool_mentions ?? [])
    .flatMap((mention) => {
      const family = inferCommittedRouteToolFamily(mention.verb_or_cue);
      const families = family && family !== "unknown" ? [family] : [];
      if (DOCS_MARKDOWN_PATH_RE.test(mention.text)) {
        families.push("docs_viewer", "repo_code");
      }
      return families;
    })
    .filter((family) => family && family !== "unknown");
  return unique([...fromAdmission, ...fromContextualAudit, ...fromSolverTrace, ...inferredFromPrompt]);
};

const allowedFamiliesFromPayload = (payload: RecordLike, sourceTarget: string): string[] => {
  const fromAdmission = readStringArray(readRecord(payload.tool_call_admission_decision)?.admitted_tool_families);
  const sourceFamily = familyForSourceTarget(sourceTarget);
  return unique([...fromAdmission, sourceFamily]);
};

const readCapabilityCandidatesFromPayload = (payload: RecordLike): HelixRouteEvidenceAuthorityTool[] => {
  const admission = readRecord(payload.tool_call_admission_decision);
  const capabilityPlan = readRecord(payload.capability_plan);
  const lifecycle = readRecord(payload.tool_lifecycle_trace);
  const operational = readRecord(payload.operational_capability_trace);
  const entries: HelixRouteEvidenceAuthorityTool[] = [];
  for (const candidate of [
    { capability: admission?.selected_capability, reason: "tool_call_admission_decision.selected_capability" },
    { capability: admission?.requested_capability, reason: "tool_call_admission_decision.requested_capability" },
    { capability: capabilityPlan?.selected_capability, reason: "capability_plan.selected_capability" },
    { capability: lifecycle?.requested_capability, reason: "tool_lifecycle_trace.requested_capability" },
    { capability: operational?.model_proposed_capability, reason: "operational_capability_trace.model_proposed_capability" },
  ]) {
    const capabilityId = readString(candidate.capability);
    if (!capabilityId) continue;
    entries.push({
      capability_id: capabilityId,
      family: inferCommittedRouteToolFamily(capabilityId),
      reason: candidate.reason,
    });
  }
  return uniqueTools(entries);
};

const readAdmittedToolsFromPayload = (payload: RecordLike): HelixRouteEvidenceAuthorityTool[] => {
  const admission = readRecord(payload.tool_call_admission_decision);
  const lifecycle = readRecord(payload.tool_lifecycle_trace);
  const operational = readRecord(payload.operational_capability_trace);
  const entries: HelixRouteEvidenceAuthorityTool[] = [];
  for (const candidate of [
    { capability: admission?.admitted_capability, reason: "tool_call_admission_decision.admitted_capability" },
    { capability: lifecycle?.admitted_capability, reason: "tool_lifecycle_trace.admitted_capability" },
    { capability: operational?.policy_admitted_capability, reason: "operational_capability_trace.policy_admitted_capability" },
  ]) {
    const capabilityId = readString(candidate.capability);
    if (!capabilityId) continue;
    entries.push({
      capability_id: capabilityId,
      family: inferCommittedRouteToolFamily(capabilityId),
      reason: candidate.reason,
      admission_ref: candidate.reason,
    });
  }
  const admittedFamilies = readStringArray(admission?.admitted_tool_families);
  for (const family of admittedFamilies) {
    entries.push({
      capability_id: `family:${family}`,
      family,
      reason: "tool_call_admission_decision.admitted_tool_families",
      admission_ref: "tool_call_admission_decision",
    });
  }
  return uniqueTools(entries);
};

const readSupportingEvidenceRefsFromPayload = (payload: RecordLike): string[] => {
  const refs: string[] = [];
  const evidenceGate = readRecord(payload.evidence_reentry_gate);
  refs.push(...readStringArray(evidenceGate?.selected_evidence_refs));
  const artifactLedger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  for (const entry of artifactLedger) {
    const artifact = readRecord(entry);
    refs.push(
      readString(artifact?.artifact_id) ||
      readString(artifact?.ref_id) ||
      readString(artifact?.evidence_ref),
    );
  }
  return unique(refs);
};

export function readCommittedAskRoute(payload: RecordLike | null | undefined): HelixCommittedAskRoute | null {
  const route = readRecord(payload?.committed_ask_route);
  return route?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA ? (route as HelixCommittedAskRoute) : null;
}

export function buildCommittedAskRoute(input: {
  turnId: string;
  promptText: string;
  selectedRoute: string;
  payload: RecordLike;
  promptInterpretation?: HelixPromptInterpretation | null;
  intentArbitration?: HelixIntentArbitration | null;
  secondaryIntentKinds?: string[];
}): HelixCommittedAskRoute {
  const existing = readCommittedAskRoute(input.payload);
  if (existing) {
    const compoundPolicy = applyCompoundTerminalPolicy(input.payload, {
      allowed: existing.canonical_goal.allowed_terminal_artifact_kinds,
      forbidden: existing.canonical_goal.forbidden_terminal_artifact_kinds,
      requiredTerminalKind: existing.canonical_goal.required_terminal_kind,
    });
    if (!compoundPolicy.policy.active) return existing;
    const requiredTerminalProduct =
      compoundPolicy.requiredTerminalKind ||
      existing.terminal_product.required_terminal_product;
    return {
      ...existing,
      canonical_goal: {
        ...existing.canonical_goal,
        required_terminal_kind: requiredTerminalProduct,
        allowed_terminal_artifact_kinds: compoundPolicy.allowed,
        forbidden_terminal_artifact_kinds: compoundPolicy.forbidden,
      },
      terminal_product: {
        ...existing.terminal_product,
        required_terminal_product: requiredTerminalProduct,
      },
    };
  }

  const route = readRouteSource(input.payload);
  const toolUseRestatement = buildToolUseRestatement(input.promptText);
  const routeContract = readRecord(input.payload.route_product_contract);
  const rawGoal = readCanonicalGoal(input.payload);
  const contextualSuppressionPresent =
    (input.promptInterpretation?.contextual_tool_mentions?.length ?? 0) > 0 ||
    (input.promptInterpretation?.negative_constraints?.length ?? 0) > 0;
  const routeContractSourceTarget = readString(routeContract?.source_target);
  const sourceContractForModelOnlyRoute =
    route.sourceTarget === "model_only" &&
    (
      sourceBackedTargets.has(routeContractSourceTarget) ||
      readStringArray(routeContract?.allowed_terminal_artifact_kinds).some((kind) =>
        /^(?:doc_|docs_|active_doc|repo_code_|live_|visual_|calculator_|process_|note_)/i.test(kind),
      )
    );
  const plainNoSourceModelOnlyRoute =
    (route.sourceTarget === "unknown" || route.sourceTarget === "model_only") &&
    rawGoal.goalKind === "unknown" &&
    rawGoal.requiredTerminalKind === "unknown" &&
    !routeContractSourceTarget &&
    toolUseRestatement.requiredToolFamilies.length === 0;
  const shouldUseModelOnlyGoal =
    plainNoSourceModelOnlyRoute ||
    (
      route.sourceTarget === "model_only" &&
      (
        contextualSuppressionPresent ||
        sourceContractForModelOnlyRoute ||
        /^(?:summarize_doc|doc_|docs_|active_doc|repo_code_)/i.test(rawGoal.goalKind)
      )
    );
  const goal = shouldUseModelOnlyGoal
    ? { goalKind: "model_only_concept", requiredTerminalKind: "direct_answer_text" }
    : rawGoal;
  const modelOnlyTerminalAliases =
    goal.goalKind === "model_only_concept" && goal.requiredTerminalKind === "direct_answer_text"
      ? Array.from(MODEL_ONLY_TERMINAL_ALIASES)
      : [];
  const rawAllowedTerminalKinds = readStringArray(routeContract?.allowed_terminal_artifact_kinds);
  const rawForbiddenTerminalKinds = readStringArray(routeContract?.forbidden_terminal_artifact_kinds);
  const rawAllowedTerminalKindsWithGoal = unique([
    ...(shouldUseModelOnlyGoal ? [] : rawAllowedTerminalKinds),
    ...modelOnlyTerminalAliases,
    goal.requiredTerminalKind !== "unknown" ? goal.requiredTerminalKind : "",
  ]);
  const rawForbiddenTerminalKindsWithGoal = shouldUseModelOnlyGoal
    ? unique([
        ...rawForbiddenTerminalKinds.filter((kind) => !MODEL_ONLY_TERMINAL_ALIASES.has(normalizeCommittedRouteTerminalKind(kind))),
        ...MODEL_ONLY_FORBIDDEN_SOURCE_TERMINALS,
      ])
    : rawForbiddenTerminalKinds;
  const compoundPolicy = applyCompoundTerminalPolicy(input.payload, {
    allowed: rawAllowedTerminalKindsWithGoal,
    forbidden: rawForbiddenTerminalKindsWithGoal,
    requiredTerminalKind: goal.requiredTerminalKind !== "unknown" ? goal.requiredTerminalKind : null,
  });
  const allowedTerminalKinds = compoundPolicy.allowed;
  const forbiddenTerminalKinds = compoundPolicy.forbidden;
  const suppressedFamilies = suppressedFamiliesFromPayload(input.payload, input.promptInterpretation);
  const allowedFamilies = unique([
    ...allowedFamiliesFromPayload(input.payload, route.sourceTarget),
    ...toolUseRestatement.requiredToolFamilies,
  ])
    .filter((family) => !suppressedFamilies.includes(family));
  const requiredFamily = familyForSourceTarget(route.sourceTarget);
  const negativeConstraints = input.promptInterpretation?.negative_constraints ?? [];
  const sourceBacked = sourceBackedTargets.has(route.sourceTarget);
  const requiredTerminalProduct =
    compoundPolicy.requiredTerminalKind ||
    (goal.requiredTerminalKind !== "unknown"
      ? goal.requiredTerminalKind
      : allowedTerminalKinds[0] ?? "unknown");
  const violations: string[] = [];

  if (sourceBacked && goal.goalKind === "model_only_concept") {
    violations.push("source_target_goal_mismatch:model_only_concept_for_source_backed_route");
  }
  if (requiredTerminalProduct !== "unknown" && forbiddenTerminalKinds.includes(requiredTerminalProduct)) {
    violations.push("required_terminal_product_forbidden");
  }
  if (sourceBacked && requiredFamily && allowedFamilies.length > 0 && !allowedFamilies.includes(requiredFamily)) {
    violations.push("required_capability_family_not_allowed");
  }

  return {
    schema: HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
    turn_id: input.turnId,
    commit_id: `committed-route:${hashShort([input.turnId, input.promptText, route.sourceTarget, goal.goalKind, requiredTerminalProduct])}`,
    prompt_hash: hashShort(input.promptText),
    committed_at_stage: "post_prompt_source_arbitration",
    prompt_intent: {
      primary_intent_kind: input.intentArbitration?.selected_primary_intent_kind ?? "unknown",
      secondary_intent_kinds: input.secondaryIntentKinds ?? [],
      interpretation_ref: input.promptInterpretation ? "prompt_interpretation" : undefined,
      arbitration_ref: input.intentArbitration ? "intent_arbitration" : undefined,
    },
    route: {
      selected_route: input.selectedRoute,
      source_target: route.sourceTarget,
      target_kind: route.targetKind,
      strength: route.strength,
      source_identity:
        readString(readRecord(input.payload.source_target_exact_contract)?.requested_source_identity) ||
        readString(readRecord(input.payload.active_doc_identity)?.active_doc_path) ||
        readWorkspaceActiveDocPath(input.payload) ||
        null,
      route_reason: route.reason,
      stale_metadata_policy: "ignore_unless_matches_commit",
    },
    canonical_goal: {
      goal_kind: goal.goalKind,
      required_terminal_kind: goal.requiredTerminalKind,
      allowed_terminal_artifact_kinds: allowedTerminalKinds,
      forbidden_terminal_artifact_kinds: forbiddenTerminalKinds,
    },
    capability_policy: {
      allowed_tool_families: allowedFamilies,
      suppressed_tool_families: suppressedFamilies,
      required_capability_families: requiredFamily ? [requiredFamily] : [],
      mutating_families_allowed: suppressedFamilies.length === 0 && negativeConstraints.length === 0,
    },
    suppression: {
      contextual_tool_mentions: promptSuppressionMentions(input.promptInterpretation),
      negative_constraints: negativeConstraints,
      suppressed_families: suppressedFamilies,
      firewall_required: true,
    },
    terminal_product: {
      terminal_authority_required: true,
      evidence_reentry_required: sourceBacked || readStringArray(routeContract?.required_artifact_refs).length > 0,
      followup_reasoning_required: sourceBacked && !/receipt|typed_failure|request_user_input/i.test(requiredTerminalProduct),
      required_terminal_product: requiredTerminalProduct,
    },
    transitions: [],
    compatibility: {
      source_goal_capability_terminal_compatible: violations.length === 0,
      stale_metadata_ignored: false,
      shortcut_firewall_applied: suppressedFamilies.length > 0,
      violations,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function evaluateCommittedAskRouteCompatibility(input: {
  committedRoute: HelixCommittedAskRoute | null | undefined;
  payload?: RecordLike | null;
}): HelixCommittedAskRouteCompatibilityResult {
  const route = input.committedRoute ?? readCommittedAskRoute(input.payload ?? undefined);
  const violations = route ? [...route.compatibility.violations] : ["committed_route_missing"];
  return {
    schema: "helix.committed_ask_route_compatibility.v1",
    turn_id: route?.turn_id ?? readString(input.payload?.turn_id) ?? "unknown-turn",
    compatible: violations.length === 0,
    violations,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildRouteEvidenceAuthority(input: {
  committedRoute: HelixCommittedAskRoute | null | undefined;
  payload?: RecordLike | null;
}): HelixRouteEvidenceAuthority {
  const payload = input.payload ?? {};
  const route = input.committedRoute ?? readCommittedAskRoute(payload);
  const candidateTools = readCapabilityCandidatesFromPayload(payload);
  const admittedFromPayload = readAdmittedToolsFromPayload(payload);
  const admittedFromRoute = route
    ? route.capability_policy.allowed_tool_families.map((family): HelixRouteEvidenceAuthorityTool => ({
        capability_id: `family:${family}`,
        family,
        reason: "committed_ask_route.capability_policy.allowed_tool_families",
        admission_ref: route.commit_id,
      }))
    : [];
  const rejectedFromRoute = route
    ? route.capability_policy.suppressed_tool_families.map((family): HelixRouteEvidenceAuthorityTool => ({
        capability_id: `family:${family}`,
        family,
        reason: "committed_ask_route.capability_policy.suppressed_tool_families",
        admission_ref: route.commit_id,
      }))
    : [];
  const allowedTerminalArtifactKinds = route?.canonical_goal.allowed_terminal_artifact_kinds ?? [];
  const forbiddenTerminalArtifactKinds = route?.canonical_goal.forbidden_terminal_artifact_kinds ?? [];
  return {
    schema: "helix.route_evidence_authority.v1",
    turn_id: route?.turn_id ?? readString(payload.turn_id) ?? "unknown-turn",
    candidate_tools: candidateTools,
    admitted_tools: uniqueTools([...admittedFromPayload, ...admittedFromRoute]),
    rejected_tools: uniqueTools(rejectedFromRoute),
    supporting_evidence_refs: readSupportingEvidenceRefsFromPayload(payload),
    allowed_terminal_artifact_kinds: allowedTerminalArtifactKinds,
    forbidden_terminal_artifact_kinds: forbiddenTerminalArtifactKinds,
    required_terminal_kind: route?.canonical_goal.required_terminal_kind ?? null,
    terminal_product_allowed: Boolean(route && allowedTerminalArtifactKinds.length > 0),
    current_turn_only: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function assertCapabilityAllowedByCommittedRoute(input: {
  committedRoute: HelixCommittedAskRoute | null | undefined;
  capabilityId: string;
  args?: RecordLike | null;
  fromShortcut?: boolean;
}): HelixCommittedAskRouteToolAdmissionResult {
  const family = inferCommittedRouteToolFamily(input.capabilityId);
  const route = input.committedRoute ?? null;
  if (!route) {
    const modelOnlyCompatible = family === "model_only" || family === "unknown";
    return {
      schema: "helix.committed_ask_route_tool_admission.v1",
      turn_id: "unknown-turn",
      capability_id: input.capabilityId,
      inferred_family: family,
      allowed: modelOnlyCompatible,
      reason: modelOnlyCompatible
        ? "committed_route_missing_model_only_compatibility"
        : "committed_route_missing_for_tool_capability",
      from_shortcut: input.fromShortcut === true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (route.capability_policy.suppressed_tool_families.includes(family)) {
    return {
      schema: "helix.committed_ask_route_tool_admission.v1",
      turn_id: route.turn_id,
      capability_id: input.capabilityId,
      inferred_family: family,
      allowed: false,
      reason: "committed_route_tool_family_suppressed",
      from_shortcut: input.fromShortcut === true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (
    route.capability_policy.allowed_tool_families.length > 0 &&
    family !== "unknown" &&
    family !== "model_only" &&
    !route.capability_policy.allowed_tool_families.includes(family)
  ) {
    return {
      schema: "helix.committed_ask_route_tool_admission.v1",
      turn_id: route.turn_id,
      capability_id: input.capabilityId,
      inferred_family: family,
      allowed: false,
      reason: "selected_capability_not_allowed_by_committed_route",
      from_shortcut: input.fromShortcut === true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (
    family === "model_only" &&
    sourceBackedTargets.has(route.route.source_target) &&
    route.terminal_product.evidence_reentry_required
  ) {
    return {
      schema: "helix.committed_ask_route_tool_admission.v1",
      turn_id: route.turn_id,
      capability_id: input.capabilityId,
      inferred_family: family,
      allowed: false,
      reason: "model_direct_answer_selected_for_source_backed_committed_route",
      from_shortcut: input.fromShortcut === true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  return {
    schema: "helix.committed_ask_route_tool_admission.v1",
    turn_id: route.turn_id,
    capability_id: input.capabilityId,
    inferred_family: family,
    allowed: true,
    reason: "capability_allowed_by_committed_route",
    from_shortcut: input.fromShortcut === true,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function committedRouteAllowsTerminalKind(input: {
  committedRoute: HelixCommittedAskRoute | null | undefined;
  terminalArtifactKind: string | null | undefined;
  finalAnswerSource?: string | null;
}): boolean {
  const route = input.committedRoute ?? null;
  if (!route) return true;

  const kind =
    normalizeCommittedRouteTerminalKind(input.terminalArtifactKind) ||
    normalizeCommittedRouteTerminalKind(input.finalAnswerSource);

  if (!kind) return false;
  if (kind === "typed_failure" || kind === "request_user_input") return true;

  if (
    route.canonical_goal.goal_kind === "model_only_concept" &&
    route.canonical_goal.required_terminal_kind === "direct_answer_text"
  ) {
    return MODEL_ONLY_TERMINAL_ALIASES.has(kind);
  }

  if (
    route.canonical_goal.forbidden_terminal_artifact_kinds
      .map(normalizeCommittedRouteTerminalKind)
      .includes(kind)
  ) {
    return false;
  }

  const allowed = route.canonical_goal.allowed_terminal_artifact_kinds
    .map(normalizeCommittedRouteTerminalKind);
  return allowed.length === 0 || allowed.includes(kind);
}

export function matchesCommittedAskRoute(
  candidateMetadata: RecordLike | null | undefined,
  committedRoute: HelixCommittedAskRoute | null | undefined,
): boolean {
  if (!candidateMetadata || !committedRoute) return false;
  const candidateTurnId = readString(candidateMetadata.turn_id);
  const candidatePromptHash = readString(candidateMetadata.prompt_hash);
  const candidateSourceTarget =
    readString(candidateMetadata.source_target) ||
    readString(candidateMetadata.target_source) ||
    readString(readRecord(candidateMetadata.source_target_intent)?.target_source);
  const candidateGoalKind =
    readString(candidateMetadata.goal_kind) ||
    readString(readRecord(candidateMetadata.canonical_goal_frame)?.goal_kind);
  return (
    (!candidateTurnId || candidateTurnId === committedRoute.turn_id) &&
    (!candidatePromptHash || candidatePromptHash === committedRoute.prompt_hash) &&
    (!candidateSourceTarget || candidateSourceTarget === committedRoute.route.source_target) &&
    (!candidateGoalKind || candidateGoalKind === committedRoute.canonical_goal.goal_kind)
  );
}
